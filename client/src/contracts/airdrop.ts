import {
  Address,
  Cell,
  beginCell,
  Contract,
  contractAddress,
  ContractProvider,
  ContractState,
  Sender,
  StateInit,
  storeMessage,
  Dictionary,
  Slice,
  toNano,
  SendMode,
} from "ton-core";

export type JettonAirdropConfig = {
  jettonWallet: Address;
};

export function jettonAirdropConfigToCell(config: JettonAirdropConfig): Cell {
  console.log(config);
  return beginCell().storeUint(0, 2).endCell();
}

export class Airdrop implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new Airdrop(address);
  }

  static createFromConfig(
    config: JettonAirdropConfig,
    code: Cell,
    workchain = 0
  ) {
    const data = jettonAirdropConfigToCell(config);
    const init = { code, data };
    return new Airdrop(contractAddress(workchain, init), init);
  }

  async sendDeploy(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    jettonWallet: Address
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x610ca46c, 32)
        .storeUint(0, 64)
        .storeAddress(jettonWallet)
        .endCell(),
    });
  }

  async sendClaim(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    amountToClaim: bigint
  ) {
    await provider.internal(via, {
      value,
      bounce: true,
      body: beginCell()
        .storeUint(0x43c7d5c9, 32) // op::process_claim
        .storeUint(0, 64) // query_id
        .storeCoins(amountToClaim) // amount to claim
        .endCell(),
    });
  }
}
