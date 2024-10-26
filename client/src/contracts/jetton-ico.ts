import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
  toNano,
} from "ton-core";

export type JettonIcoConfig = {
  totalRaised: bigint;
  platformOwnerPercentage: number;
  rate: bigint;
  platformOwner: Address;
  icoCreator: Address;
};

export function jettonIcoConfigToCell(config: JettonIcoConfig): Cell {
  return beginCell()
    .storeCoins(config.totalRaised)
    .storeUint(config.platformOwnerPercentage, 8)
    .storeUint(config.rate, 32)
    .storeUint(0, 2)
    .storeAddress(config.platformOwner)
    .storeAddress(config.icoCreator)
    .endCell();
}

export class JettonIco implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new JettonIco(address);
  }

  static createFromConfig(config: JettonIcoConfig, code: Cell, workchain = 0) {
    const data = jettonIcoConfigToCell(config);
    const init = { code, data };
    const address = contractAddress(workchain, init);
    return new JettonIco(address, init);
  }

  async sendDeploy(
    provider: ContractProvider,
    via: Sender,
    jettonWallet: Address
  ) {
    await provider.internal(via, {
      value: toNano("0.1"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x610ca46c, 32)
        .storeUint(0, 64)
        .storeAddress(jettonWallet)
        .endCell(),
    });
  }

  async sendContribute(
    provider: ContractProvider,
    via: Sender,
    amount: bigint
  ) {
    await provider.internal(via, {
      value: amount,
      bounce: true,
      body: beginCell()
        .storeUint(1, 32) // op::contribute
        .storeUint(0, 64) // query_id
        .endCell(),
    });
  }

  async sendRefund(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: toNano("0.1"),
      bounce: true,
      body: beginCell()
        .storeUint(3, 32) // op::refund
        .storeUint(0, 64) // query_id
        .endCell(),
    });
  }

  async sendClaimTokens(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: toNano("0.1"),
      bounce: true,
      body: beginCell()
        .storeUint(4, 32) // op::claim_tokens
        .storeUint(0, 64) // query_id
        .endCell(),
    });
  }

  async sendClaimFunds(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: toNano("0.1"),
      bounce: true,
      body: beginCell()
        .storeUint(5, 32) // op::claim_funds
        .storeUint(0, 64) // query_id
        .endCell(),
    });
  }

  async getContractData(provider: ContractProvider) {
    const { stack } = await provider.get("get_ico_data", []);
    return stack;
  }
}
