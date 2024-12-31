import { useState } from "react";
import { RiArrowLeftLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { toast, Flip } from "react-toastify";
import { Address, beginCell, storeStateInit, Cell, Dictionary } from "ton-core";
import { toNano } from "@ton/core";
import { getTokenDataNew } from "../helpers/tonApi";
import { JettonLockup, BalancesValue } from "../contracts/jetton-locker";
import { formatNumber, getJettonWalletAddress } from "../helpers";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import lockerHex from "../contracts/jettton-locker.compiled";
import lockService from "../api/lockService";

const CreateLock = () => {
  const [tokenVerify, setTokenVerify] = useState(false);
  const [tokenIsLoading, setTokenIsLoading] = useState(false);
  const [contract, setContract] = useState<JettonLockup | null>(null);
  const [contractData, setContractData] = useState(null);
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [modalType, setModalType] = useState(null);
  const [jettonBin, setJettonBin] = useState(null);
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    decimals: "",
    description: "",
    logo: "",
    admin_address: "",
    contract_address: "",
    user_balance: "",
    total_supply: "",
    user_jetton_address: "",
  });
  const [formData, setFormData] = useState({
    useAnotherOwner: false,
    useVestingPeriod: false,
    title: "",
    ownerAddress: walletAddress,
    tokenAddress: "",
    amount: "",
    tgeDate: "",
    tgePercentage: "",
    releaseCycle: "",
    releasePercent: "",
    tokenInfo: {
      name: "",
      symbol: "",
      decimals: "",
      description: "",
      logo: "",
      admin_address: "",
      contract_address: "",
      total_supply: "",
      user_balance: "",
    },
  });

  const JETTON_LOCKER_CODE = Cell.fromBoc(Buffer.from(lockerHex.hex, "hex"))[0];
  const DEPLOY_GAS = 100000000;
  const TRANSFER_GAS = 100000000n;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    deployContract();
  };

  async function retrieveTokenData() {
    setTokenIsLoading(true);
    try {
      const data = await getTokenDataNew(formData.tokenAddress, walletAddress);
      if (data) {
        setTokenData(data);
        setFormData({ ...formData, tokenInfo: data });
        setTokenVerify(true);
      } else {
        throw new Error("Token data is undefined or invalid");
      }
    } catch (error) {
      toast.error("Failed to retrieve token data");
    } finally {
      setTokenIsLoading(false);
    }
  }

  async function deployContract() {
    if (formData.ownerAddress === "") {
      toast.error("Owner address is required");
      return;
    }
    if (!walletAddress) {
      return;
    }

    if (Number(formData.amount) > Number(tokenData.user_balance)) {
      toast.error(`Not enough jettons`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
      return;
    }

    let owner = Address.parse(walletAddress);
    let receiver;
    let unlockedAt = Math.floor(new Date(formData.tgeDate).getTime() / 1000);

    if (formData.ownerAddress !== "") {
      receiver = Address.parse(formData.ownerAddress);
    } else {
      receiver = Address.parse(walletAddress);
    }

    const jettonLockup = JettonLockup.createFromConfig(
      {
        owner: owner,
        receiver: receiver,
        unlockedAt: unlockedAt,
      },
      JETTON_LOCKER_CODE
    );

    const jettonWallet = await getJettonWalletAddress(
      tokenData.contract_address,
      Address.normalize(jettonLockup.address)
    );

    const supportedWallets = [jettonWallet];

    let jettonBalances = Dictionary.empty(
      Dictionary.Keys.Buffer(32),
      BalancesValue
    );

    for (let _wallet of supportedWallets) {
      jettonBalances.set(_wallet.hash, { balance: toNano("0") });
    }

    const deployMessage = beginCell()
      .storeUint(0, 32 + 64)
      .storeDict(jettonBalances)
      .endCell();

    const stateConfig = {
      code: jettonLockup.init!.code,
      data: jettonLockup.init!.data,
      deployer: owner,
      value: DEPLOY_GAS,
      message: deployMessage,
    };

    const stateInit = beginCell().store(storeStateInit(stateConfig)).endCell();

    setContractData({
      stateInit: stateInit.toBoc().toString("base64"),
      deployMessage: deployMessage.toBoc().toString("base64"),
    });

    setContract(jettonLockup);
    const transferAmount =
      BigInt(formData.amount) * 10n ** BigInt(tokenData.decimals);

    let body = beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(0, 64)
      .storeCoins(transferAmount) // amount
      .storeAddress(jettonLockup.address)
      .storeAddress(Address.parse(tonConnectUI.account.address))
      .storeUint(0, 1)
      .storeCoins(toNano(0.06))
      .storeUint(0, 1)
      .storeUint(2, 2)
      .endCell();

    const binData = body.toBoc().toString("base64");

    setJettonBin({
      payload: binData,
      address: Address.normalize(tokenData.user_jetton_address),
    });

    setModalType("confirm");
  }

  async function sendTonConnectTx() {
    try {
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: contract.address.toString({
              urlSafe: true,
              bounceable: true,
            }),
            amount: DEPLOY_GAS.toString(),
            payload: contractData.deployMessage,
            stateInit: contractData.stateInit,
          },
          {
            address: jettonBin.address,
            amount: TRANSFER_GAS.toString(),
            payload: jettonBin.payload,
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      });
      if (result?.boc !== undefined) {
        let updatedFormData = {
          ...formData,
          lockAddress: Address.normalize(contract.address),
          creatorAddress: walletAddress,
        };
        const data = await lockService.createLock(updatedFormData);
        setTimeout(() => {
          toast.success("Tokens locked!", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            progress: undefined,
            theme: "colored",
            transition: Flip,
          });
        }, 5000);
        setModalType(null);
        navigate(`/safe-lock/${Address.normalize(contract.address)}`);
      }
    } catch (err) {
      if (err instanceof Error) {
        console.log(err);
        toast.error(`Error locking tokens: ${err.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          progress: undefined,
          theme: "colored",
          transition: Flip,
        });
        setModalType(null);
      }
    }
  }

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckbox1Change = (e: any) => {
    const { checked } = e.target;
    setFormData({
      ...formData,
      useAnotherOwner: checked,
    });
  };

  const handleCheckbox2Change = (e: any) => {
    const { checked } = e.target;
    setFormData({
      ...formData,
      useVestingPeriod: checked,
    });
  };

  const handleModal = (type) => {
    setModalType(type === modalType ? null : type);
  };

  return (
    <>
      <div className="flex flex-col w-full mb-24 justify-center mx-auto rounded-2xl py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white">
        {/* Header */}
        <div className="my-4">
          <p className="font-black tracking-wide text-2xl lg:text-3xl mb-1 flex gap-3 items-center">
            <div onClick={() => navigate(-1)}>
              {" "}
              <RiArrowLeftLine size="25px" />
            </div>
            Lock Tokens
          </p>
        </div>

        <div className="w-full flex flex-col justify-center">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                htmlFor="name"
              >
                Token or LP Token address<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="tokenAdrress"
                name="tokenAddress"
                className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                placeholder=""
                required
                value={formData.tokenAddress}
                onChange={handleInputChange}
              />
            </div>

            {tokenIsLoading && (
              <>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  <div className="bg-gray-300 h-6 w-40 rounded-2xl"></div>
                  <div className="bg-gray-300 h-6 w-64 rounded-2xl"></div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  <div className="bg-gray-300 h-6 w-40 rounded-2xl"></div>
                  <div className="bg-gray-300 h-6 w-64 rounded-2xl"></div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  <div className="bg-gray-300 h-6 w-40 rounded-2xl"></div>
                  <div className="bg-gray-300 h-6 w-64 rounded-2xl"></div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  <div className="bg-gray-300 h-6 w-40 rounded-2xl"></div>
                  <div className="bg-gray-300 h-6 w-64 rounded-2xl"></div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  <div className="bg-gray-300 h-6 w-40 rounded-2xl"></div>
                  <div className="bg-gray-300 h-6 w-64 rounded-2xl"></div>
                </div>
              </>
            )}
            {tokenVerify && tokenData.name !== "" && (
              <>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  Name <div>{tokenData.name}</div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  Symbol <div>{tokenData.symbol}</div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  Decimals <div>{tokenData.decimals}</div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  Total Supply{" "}
                  <div>
                    {formatNumber(tokenData.total_supply)} {tokenData.symbol}
                  </div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  Your balance{" "}
                  <div>
                    {formatNumber(tokenData.user_balance)} {tokenData.symbol}
                  </div>
                </div>
              </>
            )}
            {tokenData.user_balance == "0" ? (
              <div className="my-10 text-center">
                You do not have any {tokenData.symbol} in your wallet.
              </div>
            ) : (
              <>
                {tokenVerify && (
                  <div className="mt-4">
                    <div className="mb-4 flex gap-2 items-center">
                      <input
                        type="checkbox"
                        id="useAnotherOwner"
                        name="useAnotherOwner"
                        checked={formData.useAnotherOwner}
                        className="relative peer shrink-0 appearance-none w-6 h-6 border-2 border-gray-500 rounded-2xl bg-white mt-1 checked:bg-gray-700 checked:border-0 focus:outline-none focus:ring-offset-0 focus:ring-2 focus:ring-blue-100 disabled:border-steel-400 disabled:bg-steel-400"
                        onChange={handleCheckbox1Change}
                      />
                      <label
                        className="text-white dark:text-gray-300 text-md font-medium tracking-wide block"
                        htmlFor="useAnotherOwner"
                      >
                        Use another owner?
                      </label>
                      <svg
                        className="
              absolute 
              w-4 h-4 mt-1 ml-1
              hidden peer-checked:block
              pointer-events-none"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>

                    {formData.useAnotherOwner && (
                      <div className="mb-4">
                        <label
                          className="text-white dark:text-gray-300 text-md font-medium tracking-wide block"
                          htmlFor="ownerAddress"
                        >
                          Owner
                        </label>
                        <span className="text-gray-400 dark:text-gray-400 text-sm font-normal tracking-wide block mb-2">
                          This Address will receive the tokens once they are
                          unlocked
                        </span>
                        <input
                          type="text"
                          id="ownerAddress"
                          name="ownerAddress"
                          required
                          className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                          placeholder=""
                          value={formData.ownerAddress}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}

                    <div className="mb-4">
                      <label
                        className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                        htmlFor="symbol"
                      >
                        Lock Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                        placeholder="Ex: My SAFE Lock"
                        value={formData.title}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="mb-4">
                      <label
                        className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                        htmlFor="totalSupply"
                      >
                        Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="amount"
                        name="amount"
                        required
                        className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                        placeholder="100000"
                        value={formData.amount}
                        onChange={handleInputChange}
                      />
                    </div>
                    {/*}
                  <div className="mb-4 flex gap-2 items-center">
                    <input
                      type="checkbox"
                      id="useVestingPeriod"
                      name="useVestingPeriod"
                      checked={formData.useVestingPeriod}
                      className="relative peer shrink-0
              appearance-none w-6 h-6 border-2 border-gray-500 rounded-2xl bg-white
              mt-1
              checked:bg-gray-700 checked:border-0
              focus:outline-none focus:ring-offset-0 focus:ring-2 focus:ring-blue-100
              disabled:border-steel-400 disabled:bg-steel-400"
                      onChange={handleCheckbox2Change}
                    />
                    <label
                      className="text-white dark:text-gray-300 text-md font-medium tracking-wide block"
                      htmlFor="useVestingPeriod"
                    >
                      Use vesting period?
                    </label>
                    <svg
                      className="
              absolute 
              w-4 h-4 mt-1 ml-1
              hidden peer-checked:block
              pointer-events-none"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>*/}

                    {!formData.useVestingPeriod && (
                      <div className="mb-4">
                        <label
                          className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                          htmlFor="tgeDate"
                        >
                          Lock until (UTC)
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          id="tgeDate"
                          name="tgeDate"
                          required
                          className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                          placeholder="100000"
                          value={formData.tgeDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}
                    {/*}
                  {formData.useVestingPeriod && (
                    <>
                      <div className="mb-4 xl:flex md:gap-4 md:w-full md:flex-wrap">
                        <div className="xl:w-[49%]">
                          <label
                            className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                            htmlFor="tgeDate"
                          >
                            TGE Date (Local time)
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            id="tgeDate"
                            name="tgeDate"
                            className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                            value={formData.tgeDate}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="xl:w-[49%]">
                          <label
                            className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                            htmlFor="tgePercentage"
                          >
                            TGE Percentage
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="tgePercentage"
                            name="tgePercentage"
                            className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                            placeholder="Ex: 10"
                            value={formData.tgePercentage}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="mb-4 xl:flex md:gap-4 md:w-full md:flex-wrap">
                        <div className="xl:w-[49%]">
                          <label
                            className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                            htmlFor="releaseCycle"
                          >
                            Release Cycle Interval (days)
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="releaseCycle"
                            name="releaseCycle"
                            className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                            placeholder="Ex: 10"
                            value={formData.releaseCycle}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="xl:w-[49%]">
                          <label
                            className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                            htmlFor="releasePercent"
                          >
                            Cycle Release Percent
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="releasePercent"
                            name="releasePercent"
                            className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                            placeholder="Ex: 10"
                            value={formData.releasePercent}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </>
                  )}*/}
                  </div>
                )}
              </>
            )}

            <div className="my-6 text-center">
              {!walletAddress ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    tonConnectUI.openModal();
                  }}
                  className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                >
                  Connect Wallet
                </button>
              ) : (
                <>
                  {!tokenVerify ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        retrieveTokenData();
                      }}
                      className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                    >
                      Verify
                    </button>
                  ) : (
                    <>
                      {contract != null ? (
                        <button
                          onClick={sendTonConnectTx}
                          className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                        >
                          Deploy Lock
                        </button>
                      ) : (
                        <>
                          {tokenData.user_balance == "0" ? null : (
                            <button
                              type="submit"
                              className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                            >
                              Create Lock
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </form>
        </div>
      </div>
      {modalType === "confirm" && (
        <ConfirmationModal
          closeModal={handleModal}
          sendTonConnectTx={sendTonConnectTx}
        />
      )}
    </>
  );
};

const ConfirmationModal = ({ closeModal, sendTonConnectTx }) => {
  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-500 bg-opacity-75 z-50">
      <div className="text-safemoon-alt  px-4 md:px-4 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-md w-[90%] mt-20 z-[1000]">
        <h2 className="text-base md:text-lg font-semibold mb-4">
          Confirm token lock
        </h2>
        <p className="mb-4 tracking-wide text-sm">
          Are you sure you want to lock your tokens?
        </p>
        <div className="flex gap-4 ">
          <button
            className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-red-500 dark:hover:bg-red-700 text-white bg-red-500 dark:hover:text-white hover:text-white hover:bg-red-700 dark:text-white"
            onClick={() => closeModal(null)}
          >
            No
          </button>
          <button
            className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-white/30 dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/50 dark:text-gray-300"
            onClick={() => sendTonConnectTx()}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateLock;
