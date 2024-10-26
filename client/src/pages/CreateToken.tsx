import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BN from "bn.js";
import { checkImageURL } from "../helpers";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { toast, Flip } from "react-toastify";
import { RiSearch2Line } from "react-icons/ri";
import {
  Address,
  beginCell,
  contractAddress,
  storeStateInit,
  Cell,
  loadStateInit,
} from "ton-core";
import { createJettonDeployParams } from "../contracts/jetton-minter";
//@ts-ignore
import DefaultImage from "../assets/images/default.png";
import { IsTokenCreated } from "../helpers/tonApi";
import TokenCreated from "./TokenCreated";

const CreateToken = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    symbol: "",
    amount: "",
    decimals: "",
    description: "",
    totalSupply: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [isLoading, setIsLoading] = useState(false);
  const [contractData, setContractData] = useState(null);
  const [isCreated, setIsCreated] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const deployParams = await deployContract();
      if (!deployParams) {
        return;
      }
      const contractAddress = jettonAddress(deployParams);
      if (contractAddress) {
        const contractDeployer = await processContract(
          contractAddress.toString(),
          deployParams.message,
          new BN(deployParams.value.toString()),
          deployParams.stateInit
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        console.log(err);
        toast.error(`${err.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          progress: undefined,
          theme: "colored",
          transition: Flip,
        });
        //navigate(`/token/${Address.normalize(contractAddress)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSearchChange = (e: any) => {
    setSearchQuery(e.target.value);
  };

  const findToken = () => {
    navigate(`/token/${searchQuery}`);
  };

  async function deployContract() {
    if (!walletAddress) {
      return;
    }
    const params = createJettonDeployParams(
      {
        amountToMint:
          BigInt(formData.amount) * 10n ** BigInt(formData.decimals),
        owner: Address.parse(walletAddress),
        onchainMetaData: {
          name: formData.name,
          symbol: formData.symbol,
          decimals: formData.decimals,
          description: formData.description,
          image: formData.logo,
        },
      },
      undefined
    );

    return {
      ...params,
      stateInit: beginCell().store(storeStateInit(params)).endCell(),
    };
  }

  function jettonAddress(deployParams: any) {
    const address = contractAddress(0, deployParams);
    return address;
  }

  async function processContract(
    address: string,
    cell: Cell,
    amount: BN | bigint,
    init: Cell
  ) {
    const binData =
      cell &&
      cell.toBoc().toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
    const initCell =
      init &&
      init.toBoc().toString("base64").replace(/\//g, "_").replace(/\+/g, "-");

    let data = {
      address: address,
      amount: amount.toString(),
      payload: binData,
      stateInit: initCell || undefined,
    };
    await sendTonConnectTx(data);
  }

  async function sendTonConnectTx(contractData) {
    const tokenStatus = await IsTokenCreated(contractData.address);
    if (tokenStatus == true) {
      toast.success("Token created already!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
      setIsLoading(false);
      setContractData(contractData.address);
      setIsCreated(true);
    } else {
      try {
        const result = await tonConnectUI.sendTransaction({
          messages: [
            {
              address: contractData.address,
              amount: contractData.amount,
              payload: contractData.payload,
              stateInit: contractData.stateInit,
            },
          ],
          validUntil: Math.floor(Date.now() / 1000) + 300,
        });

        if (result?.boc !== undefined) {
          setTimeout(() => {
            toast.success("Token created!", {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              progress: undefined,
              theme: "colored",
              transition: Flip,
            });
            setIsLoading(false);
            setContractData(contractData.address);
            setIsCreated(true);
          }, 5000);
        }
      } catch (err) {
        if (err instanceof Error) {
          console.log(err);
          toast.error(`Error creating token: ${err.message}`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            progress: undefined,
            theme: "colored",
            transition: Flip,
          });
          setIsLoading(false);
        }
      }
    }
  }

  return (
    <>
      {isCreated ? (
        <TokenCreated tokenData={formData} address={contractData} />
      ) : (
        <>
          {isLoading && (
            <div
              role="status"
              className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-white/20 bg-opacity-75 z-50"
            >
              <svg
                aria-hidden="true"
                className="w-14 h-14 text-gray-200 animate-spin dark:text-gray-600 fill-[#27233f] dark:fill-white"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          )}

          <div className="flex flex-col w-full mb-24 justify-center mx-auto rounded-2xl py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white">
            {/* Header */}
            <div className="my-4">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-2">
                <div className="">
                  {" "}
                  <p className="font-black tracking-wide text-2xl lg:text-3xl mb-1">
                    Create Token
                  </p>
                  <p className="mb-3 max-w-[30rem] text-sm font-light hidden lg:block text-gray-400 dark:text-gray-400">
                    Create your own token by filling the form
                  </p>
                </div>
                <div className="relative w-full lg:w-[20rem]">
                  <input
                    type="text"
                    placeholder="Jetton Address    "
                    className="py-2 sm:py-2 px-2 sm:px-2 rounded-2xl  text-gray-400 text-sm font-medium w-full pl-8 sm:pl-12 outline-none dark:text-white dark:bg-white/10 "
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  <span className="absolute left-2 sm:left-5 text-lg top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white">
                    <RiSearch2Line />
                  </span>
                  {searchQuery !== "" && (
                    <span
                      onClick={findToken}
                      className="cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-300 absolute right-2 sm:right-5 text-xs font-semibold rounded-2xl py-1 px-2 bg-gray-500 dark:bg-white top-1/2 transform ease-in-out duration-200 -translate-y-1/2 text-white dark:text-black"
                    >
                      Go
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full flex flex-col justify-center">
              <div className="flex flex-row justify-center items-start gap-2 my-2 lg:my-4">
                <div>
                  {formData.logo && checkImageURL(formData.logo) ? (
                    <img
                      src={formData.logo}
                      className="w-16 h-16 bg-white rounded-full"
                    />
                  ) : (
                    <img
                      src={DefaultImage}
                      className="w-16 h-16 bg-white rounded-full"
                    />
                  )}
                </div>
                <div className="flex items-start flex-col ">
                  <p className="font-semibold text-sm">
                    {formData.name ? formData.name : "Jetton Name"} (
                    {formData.symbol ? formData.symbol : "Symbol"})
                  </p>
                  <p className="text-gray-400 dark:text-gray-400 text-xs ">
                    {formData.description ? (
                      <>
                        {formData.description.slice(0, 15)}
                        {formData.description.length > 15 && "..."}
                      </>
                    ) : (
                      "Description"
                    )}
                  </p>
                </div>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block"
                    htmlFor="symbol"
                  >
                    Jetton Logo URL<span className="text-red-500">*</span>
                  </label>
                  <span className="text-gray-400 dark:text-gray-400 text-sm font-normal tracking-wide block mb-2">
                    URL of a 500x500px PNG image of your token logo with
                    transparent background.
                  </span>
                  <input
                    type="text"
                    id="logo"
                    name="logo"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="Ex: https://..."
                    required
                    value={formData.logo}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block"
                    htmlFor="name"
                  >
                    Name<span className="text-red-500">*</span>
                  </label>
                  <span className="text-gray-400 dark:text-gray-400 text-sm font-normal tracking-wide block mb-2">
                    Your project full name with spaces (usually 1-3 words)
                  </span>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="Ex: SafemoonTon"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block"
                    htmlFor="symbol"
                  >
                    Symbol<span className="text-red-500">*</span>
                  </label>
                  <span className="text-gray-400 dark:text-gray-400 text-sm font-normal tracking-wide block mb-2">
                    Token symbol appearing in balance (usually 3-5 uppercase
                    characters)
                  </span>
                  <input
                    type="text"
                    id="symbol"
                    name="symbol"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="SAFET"
                    required
                    value={formData.symbol}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block"
                    htmlFor="decimals"
                  >
                    Decimals<span className="text-red-500">*</span>
                  </label>
                  <span className="text-gray-400 dark:text-gray-400 text-sm font-normal tracking-wide block mb-2">
                    The decimal precision of your token (9 is TON default)
                  </span>
                  <input
                    type="text"
                    id="decimals"
                    name="decimals"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="9"
                    required
                    value={formData.decimals}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block"
                    htmlFor="totalSupply"
                  >
                    Amount to mint<span className="text-red-500">*</span>
                  </label>
                  <span className="text-gray-400 dark:text-gray-400 text-sm font-normal tracking-wide block mb-2">
                    Number of initial tokens to mint and send to your wallet
                    address
                  </span>
                  <input
                    type="text"
                    id="amount"
                    name="amount"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="21,000,000"
                    required
                    value={formData.amount}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                    htmlFor="totalSupply"
                  >
                    Token/Project Description
                  </label>
                  <textarea
                    className="shadow appearance-none border rounded-2xl text-md w-full resize-none py-3 px-3 text-gray-700 leading-tight focus:outline-none"
                    value={formData.description}
                    rows={2}
                    id="description"
                    name="description"
                    placeholder=" Ex: About our token"
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                <div className="my-6 text-center">
                  {walletAddress ? (
                    <>
                      <button
                        type="submit"
                        className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                      >
                        Create Token
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        tonConnectUI.openModal();
                      }}
                      className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CreateToken;
