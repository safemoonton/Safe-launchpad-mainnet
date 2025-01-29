import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  RiArrowLeftLine,
  RiTwitterXLine,
  RiTelegramLine,
  RiGlobalLine,
  RiFacebookLine,
  RiDiscordLine,
  RiRedditLine,
} from "react-icons/ri";
import { toast, Flip } from "react-toastify";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaCopy, FaCheckCircle } from "react-icons/fa";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import {
  formatNumber,
  getJettonWalletAddressLock,
  makeElipsisAddress,
} from "../helpers";
//@ts-ignore
import TonLogo from "../assets/images/ton-logo.png";
import BN from "bn.js";
import { Address, beginCell, storeStateInit, Cell, toNano } from "ton-core";
import icoHex from "../contracts/jetton-ico-public.compiled";
import icoService from "../api/icoService";
import { getTokenDataNew } from "../helpers/tonApi";
import { JettonIco } from "../contracts/jetton-ico";
import { PLATFORM_OWNER } from "../contracts/platform";

const CreatePresale = () => {
  const JETTON_ICO_CODE = Cell.fromBoc(Buffer.from(icoHex.hex, "hex"))[0];
  const PUBLIC_PLATFORM_FEE = 5;
  const DEPLOY_GAS = 200000000;
  const TRANSFER_GAS = 100000000;

  const walletAddress = useTonAddress();

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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
    launchpadType: "public",
    creatorAddress: walletAddress,
    listingType: "auto",
    token_price: null,
    title: "",
    logo: "",
    website: "",
    twitter: "",
    reddit: "",
    telegram: "",
    github: "",
    instagram: "",
    discord: "",
    facebook: "",
    description: "",
    total_token_sale: 0,
    total_token_presale: 0,
    total_raise: "",
    soft_cap: 0,
    hard_cap: 0,
    min_buy: 0,
    max_buy: 0,
    lp_jettons: 0,
    lp_percent: "",
    listing_price: "0",
    tokenAddress: "",
  });

  const [tonConnectUI] = useTonConnectUI();
  const [copied, setCopied] = useState(false);
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
  const [tokenVerify, setTokenVerify] = useState(false);
  const [tokenIsLoading, setTokenIsLoading] = useState(false);
  const [formStep, setFormStep] = useState(0);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function handleLaunchpadTypeChange(type: string) {
    setFormData({
      ...formData,
      launchpadType: type,
      listingType: type == "private" ? "manual" : "auto",
    });
  }

  function handleListingTypeChange(type: string) {
    if (formData.launchpadType == "private" && type == "auto") {
      return;
    } else {
      setFormData({
        ...formData,
        listingType: type,
      });
    }
  }

function trimNumber(num) {
    if (typeof num === 'number') {
        return num.toFixed(20).replace(/\.?0+$/, ''); // Convert to string, fix precision, and trim trailing zeros
    } else if (typeof num === 'string') {
        return num.replace(/\.?0+$/, ''); // Just trim trailing zeros for strings
    }
    throw new Error('Invalid input type for trimNumber');
}

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const deployParams = await deployContract();
  };

  async function deployContract() {
    if (!walletAddress) {
      return;
    }

    if (Number(formData.total_token_sale) > Number(tokenData.user_balance)) {
      toast.error(`Not enough ${tokenData.symbol}`, {
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

    //ICO DEPLOYMENT SETUP
    const owner = Address.parse(walletAddress);
    console.log("TOKEN PRICE", formData.token_price);
    console.log("TOKEN PRICE TRIMMED", trimNumber(formData.token_price));
    console.log(
      "TOKEN PRICE STRING",
      toNano(trimNumber(formData.token_price).toString())
    );
    const rate = toNano(trimNumber(formData.token_price).toString());

    const jettonIco = JettonIco.createFromConfig(
      {
        totalRaised: toNano("0"),
        platformOwnerPercentage: PUBLIC_PLATFORM_FEE,
        rate: rate,
        platformOwner: Address.parse(PLATFORM_OWNER),
        icoCreator: owner,
      },
      JETTON_ICO_CODE
    );

    const icoAddress = Address.normalize(jettonIco.address);

    const icoWallet = await getJettonWalletAddressLock(
      tokenData.contract_address,
      Address.normalize(icoAddress)
    );

    const icoBody = beginCell()
      .storeUint(0x610ca46c, 32)
      .storeUint(0, 64)
      .storeAddress(Address.parse(icoWallet))
      .endCell();

    const params = {
      code: jettonIco.init.code,
      data: jettonIco.init.data,
      deployer: Address.parse(walletAddress),
      value: DEPLOY_GAS,
      message: icoBody,
    };

    const icoState = beginCell().store(storeStateInit(params)).endCell();

    const icoDeployer = {
      address: jettonIco.address.toString({ urlSafe: true, bounceable: true }),
      amount: new BN(DEPLOY_GAS.toString()).toString(),
      payload: icoBody && icoBody.toBoc().toString("base64"),
      stateInit: icoState && icoState.toBoc().toString("base64"),
    };

    // JETTON TRANSFER SETUP
    const transferAmount =
      BigInt(formData.total_token_sale) *
      10n ** BigInt(formData.tokenInfo.decimals);

    const body = beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(0, 64)
      .storeCoins(transferAmount)
      .storeAddress(jettonIco.address)
      .storeAddress(Address.parse(tonConnectUI.account.address))
      .storeUint(0, 1)
      .storeCoins(toNano("0.06"))
      .storeUint(0, 1)
      .storeUint(2, 2)
      .endCell();

    const jettonWallet = await getJettonWalletAddressLock(
      tokenData.contract_address,
      tonConnectUI.account?.address
    );

    const binData = body.toBoc().toString("base64");

    const transferData = {
      payload: binData,
      address: Address.normalize(tokenData.user_jetton_address),
    };

    await sendTonTx(icoDeployer, transferData, icoAddress, icoWallet);
  }

  async function sendTonTx(icoDeployer, transferData, icoAddress, icoWallet) {
    try {
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: icoDeployer.address,
            amount: icoDeployer.amount,
            payload: icoDeployer.payload,
            stateInit: icoDeployer.stateInit,
          },
          {
            address: transferData.address,
            amount: TRANSFER_GAS.toString(),
            payload: transferData.payload,
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      });
      if (result?.boc !== undefined) {
        setTokenIsLoading(true);
        const icoData = {
          ...formData,
          launchpadAddress: icoAddress,
          launchpadWalletAddress: icoWallet,
        };
        const ico = await icoService.createICO(icoData);
        if (ico) {
          setTimeout(() => {
            toast.success("Project launched successfully", {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              progress: undefined,
              theme: "colored",
              transition: Flip,
            });
            navigate(`/safe-launch/${ico._id}`);
          }, 5000);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setTokenIsLoading(false);
        toast.error(`Error deploying ICO: ${err.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          progress: undefined,
          theme: "colored",
          transition: Flip,
        });
      }
    }
  }

  const parameterChecks = () => {
    if (formStep === 0) {
      const {
        hard_cap,
        soft_cap,
        min_buy,
        max_buy,
        total_token_presale,
        tokenInfo,
      } = formData;

      if (
        hard_cap === 0 ||
        soft_cap === 0 ||
        min_buy === 0 ||
        max_buy === 0 ||
        total_token_presale === 0 ||
        !tokenInfo?.name
      ) {
        toast.error("Complete all required fields", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          progress: undefined,
          theme: "colored",
          transition: Flip,
        });
      } else {
        if (Number(soft_cap) > Number(hard_cap)) {
          toast.error("Hard Cap cannot be lower than Soft Cap", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            progress: undefined,
            theme: "colored",
            transition: Flip,
          });
        } else if (Number(min_buy) > Number(max_buy)) {
          toast.error("Max buy cannot be lower than min buy", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            progress: undefined,
            theme: "colored",
            transition: Flip,
          });
        } else {
          setFormData({
            ...formData,
            token_price: (
              Number(hard_cap) / Number(total_token_presale)
            ).toFixed(10),
          });
          setFormStep(1);
        }
      }
    }

    if (formStep == 1) {
      const {
        listingType,
        total_token_presale,
        lp_percent,
        lp_jettons,
        listing_price,
      } = formData;

      if (listingType == "") {
        toast.error(`Complete all required fields`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          progress: undefined,
          theme: "colored",
          transition: Flip,
        });
      } else if (listingType == "auto" && lp_percent == "") {
        toast.error(`Add your liquidity percentage`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          progress: undefined,
          theme: "colored",
          transition: Flip,
        });
      } else if (listingType == "auto" && Number(lp_percent) < 51) {
        toast.error(`Liquidity percentage cannot be lower than 51%`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          progress: undefined,
          theme: "colored",
          transition: Flip,
        });
      } else if (listingType == "auto" && lp_jettons == 0) {
        toast.error(`Tokens for liquidity is required`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          progress: undefined,
          theme: "colored",
          transition: Flip,
        });
      } else if (
        listingType == "auto" &&
        listing_price == "" &&
        Number(listing_price) == 0
      ) {
        toast.error(`Listing price cannot be zero`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          progress: undefined,
          theme: "colored",
          transition: Flip,
        });
      } else {
        setFormData({
          ...formData,
          total_token_sale: Number(total_token_presale) + Number(lp_jettons),
        });
        setFormStep(2);
      }
    }

    if (formStep == 2) {
      if (formData.title == "" || formData.description == "") {
        toast.error(`Complete all required fields`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          progress: undefined,
          theme: "colored",
          transition: Flip,
        });
      } else {
        const updatedFormData = {
          logo: "",
        };

        if (formData.logo == "") {
          updatedFormData.logo = tokenData.logo;
          setFormData({ ...formData, ...updatedFormData });
        }

        setFormStep(3);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
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

  return (
    <div className="flex flex-col w-full mb-24 justify-center mx-auto rounded-2xl py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white">
      {/* Header */}
      <div className="my-4">
        <p className="font-black tracking-wide text-2xl lg:text-3xl mb-1 flex gap-3 items-center">
          <Link to="/safe-launch">
            {" "}
            <RiArrowLeftLine size="25px" />
          </Link>
          Launch Project
        </p>
      </div>
      {/* BODY */}
      <div className="w-full flex flex-col justify-center">
        {/* PROGRESS BODY */}
        <div className="mt-2 mb-4">
          <ol className="hidden lg:flex items-center w-full p-3 space-x-2 text-sm font-medium text-center text-gray-500 bg-white border border-gray-200 rounded-2xl shadow-sm dark:text-gray-400 sm:text-base dark:bg-black dark:border-gray-700 sm:p-4 sm:space-x-4 rtl:space-x-reverse">
            <li
              className={`flex items-center ${
                [0].includes(formStep) && "text-safemoon-dark dark:text-white"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ${
                  [0].includes(formStep)
                    ? "dark:border-white border-safemoon-dark"
                    : "border-gray-500 dark:border-gray-400"
                }`}
              >
                1
              </span>
              <span>
                <h3 className="font-medium leading-tight text-start">
                  Verify Token
                </h3>
                <p className="text-xs text-start hidden lg:block">
                  Enter the token address and verify
                </p>
              </span>
              <svg
                className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 12 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m7 9 4-4-4-4M1 9l4-4-4-4"
                />
              </svg>
            </li>
            <li
              className={`flex items-center ${
                [1].includes(formStep) && "text-safemoon-dark dark:text-white"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ${
                  [1].includes(formStep)
                    ? "dark:border-white border-safemoon-dark"
                    : "border-gray-500 dark:border-gray-400"
                }`}
              >
                2
              </span>
              <span>
                <h3 className="font-medium leading-tight text-start">
                  Launchpad Info
                </h3>
                <p className="text-xs text-start hidden lg:block">
                  Enter all details about your presale
                </p>
              </span>
              <svg
                className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 12 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m7 9 4-4-4-4M1 9l4-4-4-4"
                />
              </svg>
            </li>
            <li
              className={`flex items-center ${
                [2].includes(formStep) && "text-safemoon-dark dark:text-white"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ${
                  [2].includes(formStep)
                    ? "dark:border-white border-safemoon-dark"
                    : "border-gray-500 dark:border-gray-400"
                }`}
              >
                3
              </span>
              <span>
                <h3 className="font-medium leading-tight text-start">
                  Project Info
                </h3>
                <p className="text-xs text-start hidden lg:block">
                  Let people know about your project
                </p>
              </span>
              <svg
                className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 12 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m7 9 4-4-4-4M1 9l4-4-4-4"
                />
              </svg>
            </li>
            <li
              className={`flex items-center ${
                [3].includes(formStep) && "text-safemoon-dark dark:text-white"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ${
                  [3].includes(formStep)
                    ? "dark:border-white border-safemoon-dark"
                    : "border-gray-500 dark:border-gray-400"
                }`}
              >
                4
              </span>
              <span>
                <h3 className="font-medium leading-tight text-start">Finish</h3>
                <p className="text-xs text-start hidden lg:block">
                  Review your information
                </p>
              </span>
            </li>
          </ol>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ====== STEP 0 ======== */}
          {formStep === 0 && (
            <>
              <div className="mb-4">
                <label
                  className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                  htmlFor="name"
                >
                  Token address<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="tokenAddress"
                  name="tokenAddress"
                  className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                  placeholder="Token Address"
                  required
                  readOnly={!tokenVerify ? false : true}
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
              {/********* OTHER TOKEN INFO **********/}
              {tokenData.user_balance == "0" ? (
                <div className="my-10 text-center">
                  You do not have any {tokenData.symbol} in your wallet.
                </div>
              ) : (
                <>
                  {tokenVerify && (
                    <div className="mt-4">
                      <div className="mb-4 xl:flex md:gap-4 md:w-full md:flex-wrap">
                        <div className="mb-4 xl:mb-0 xl:w-full">
                          <label
                            className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                            htmlFor="logo"
                          >
                            Total Tokens For Presale
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="total_token_presale"
                            name="total_token_presale"
                            className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                            value={formData.total_token_presale}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="mb-4 xl:flex md:gap-4 md:w-full md:flex-wrap">
                        <div className="mb-4 xl:mb-0 xl:w-[49%]">
                          <label
                            className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                            htmlFor="soft_cap"
                          >
                            Soft Cap (in TON)
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="soft_cap"
                            name="soft_cap"
                            className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                            value={formData.soft_cap}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="xl:w-[49%]">
                          <label
                            className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                            htmlFor="hard_cap"
                          >
                            Hard Cap (in TON)
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="hard_cap"
                            name="hard_cap"
                            className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                            value={formData.hard_cap}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="mb-4 xl:flex md:gap-4 md:w-full md:flex-wrap">
                        <div className="mb-4 xl:mb-0 xl:w-[49%]">
                          <label
                            className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                            htmlFor="min_buy"
                          >
                            Min buy (in TON)
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="min_buy"
                            name="min_buy"
                            className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                            value={formData.min_buy}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="xl:w-[49%]">
                          <label
                            className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                            htmlFor="max_buy"
                          >
                            Max buy (in TON)
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="max_buy"
                            name="max_buy"
                            className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                            value={formData.max_buy}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      {formData.total_token_presale !== 0 &&
                        formData.total_token_presale !== null &&
                        formData.hard_cap !== 0 &&
                        formData.hard_cap !== null && (
                          <div className="flex gap-8 justify-center items-center my-16">
                            <p className="text-white dark:text-gray-300 text-xl font-bold tracking-wide uppercase">
                              Token Price
                            </p>
                            <h1 className="text-white dark:text-gray-300 text-3xl font-bold tracking-wide uppercase">
                              <img
                                src={TonLogo}
                                alt="TON"
                                className="w-10 h-10 inline-block rounded-full mr-2"
                              />
                              {(
                                Number(formData.hard_cap) /
                                Number(formData.total_token_presale)
                              ).toFixed(10)}{" "}
                              TON
                            </h1>
                          </div>
                        )}
                    </div>
                  )}
                </>
              )}

              {!walletAddress ? (
                <div className="my-6 text-center">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      tonConnectUI.openModal();
                    }}
                    className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <>
                  {!tokenVerify ? (
                    <div className="my-6 text-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          retrieveTokenData();
                        }}
                        className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                      >
                        Verify
                      </button>
                    </div>
                  ) : (
                    <>
                      {tokenData.user_balance == "0" ? null : (
                        <div className="my-6 text-center">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              parameterChecks();
                            }}
                            className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* STEP 1 */}
          {formStep === 1 && (
            <>
              <div className="mb-4">
                <label
                  className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                  htmlFor="logo"
                >
                  Type
                  <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center mb-1">
                  <input
                    type="radio"
                    id="public"
                    name="launchpadType"
                    value="public"
                    checked={formData.launchpadType === "public"}
                    onChange={() => handleLaunchpadTypeChange("public")}
                    className="w-4 h-4 bg-gray-100 border-gray-300 focus:none dark:focus:none dark:ring-transparent focus:ring-transparent dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor="public"
                    className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    Presale (Public)
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label
                  className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                  htmlFor="logo"
                >
                  Fee
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center mb-1">
                  <input
                    type="radio"
                    name="fee"
                    value="public"
                    checked={formData.launchpadType === "public"}
                    className="w-4 h-4  bg-gray-100 border-gray-300 focus:none dark:focus:none dark:ring-transparent focus:ring-transparent dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor="public"
                    className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    5% TON raised only
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label
                  className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                  htmlFor="logo"
                >
                  Listing Options
                  <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center mb-1">
                  <input
                    type="radio"
                    name="listingType"
                    value="auto"
                    checked={formData.listingType === "auto"}
                    onChange={() => handleListingTypeChange("auto")}
                    className="w-4 h-4  bg-gray-100 border-gray-300 focus:none dark:focus:none dark:ring-transparent focus:ring-transparent dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor="auto"
                    className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    Auto Listing
                  </label>
                </div>
              </div>

              {formData.launchpadType == "public" && (
                <>
                  <div className="mb-4">
                    <label
                      className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                      htmlFor="lp_percent"
                    >
                      Liquidity Percent <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="lp_percent"
                      name="lp_percent"
                      className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                      placeholder="Ex: 51"
                      required
                      value={formData.lp_percent}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                      htmlFor="lp_jettons"
                    >
                      Token Allocation (Liquidity pool){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="lp_jettons"
                      name="lp_jettons"
                      className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                      placeholder="0"
                      required
                      value={formData.lp_jettons}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                      htmlFor="listing_price"
                    >
                      Listing Price (in TON){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="listing_price"
                      name="listing_price"
                      className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                      placeholder="0"
                      required
                      value={formData.listing_price}
                      onChange={handleInputChange}
                    />
                  </div>
                  {formData.lp_jettons !== 0 &&
                    formData.lp_jettons !== null &&
                    formData.total_token_presale !== 0 &&
                    formData.total_token_presale !== null && (
                      <div className="flex mx-auto items-center text-white/80 justify-center my-8 border border-yellow-900 p-2 rounded-2xl bg-yellow-300/20">
                        Total {tokenData.symbol} required:{" "}
                        {formatNumber(
                          Number(formData.lp_jettons) +
                            Number(formData.total_token_presale)
                        )}{" "}
                        {tokenData.symbol}
                      </div>
                    )}
                </>
              )}

              <div className="my-6 flex flex-row justify-center gap-4 text-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setFormStep(0);
                  }}
                  className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                >
                  Back
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    parameterChecks();
                  }}
                  className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {formStep === 2 && (
            <>
              <div className="mb-4">
                <label
                  className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                  htmlFor="symbol"
                >
                  Launchpad Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                  placeholder="Ex: SafeMoon Fairlaunch"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mb-4 xl:flex md:gap-4 md:w-full md:flex-wrap">
                <div className="mb-4 xl:mb-0 xl:w-[49%]">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                    htmlFor="logo"
                  >
                    Logo URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="logo"
                    name="logo"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="Ex: https://..."
                    value={formData.tokenInfo?.logo}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="xl:w-[49%]">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                    htmlFor="website"
                  >
                    Website
                  </label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="Ex: https://..."
                    value={formData.website}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="mb-4 xl:flex md:gap-4 md:w-full md:flex-wrap">
                <div className="mb-4 xl:mb-0 xl:w-[49%]">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                    htmlFor="facebook"
                  >
                    Facebook
                  </label>
                  <input
                    type="text"
                    id="facebook"
                    name="facebook"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="Ex: https://facebook.com/..."
                    value={formData.facebook}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="xl:w-[49%]">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                    htmlFor="twitter"
                  >
                    Twitter/X
                  </label>
                  <input
                    type="text"
                    id="twitter"
                    name="twitter"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="Ex: https://twitter.com/..."
                    value={formData.twitter}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="mb-4 xl:flex md:gap-4 md:w-full md:flex-wrap">
                <div className="mb-4 xl:mb-0 xl:w-[49%]">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                    htmlFor="github"
                  >
                    Github
                  </label>
                  <input
                    type="text"
                    id="github"
                    name="github"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="Ex: https://github.com/..."
                    value={formData.github}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="xl:w-[49%]">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                    htmlFor="telegram"
                  >
                    Telegram
                  </label>
                  <input
                    type="text"
                    id="telegram"
                    name="telegram"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="Ex: https://t.me/..."
                    value={formData.telegram}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="mb-4 xl:flex md:gap-4 md:w-full md:flex-wrap">
                <div className="mb-4 xl:mb-0 xl:w-[49%]">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                    htmlFor="instagram"
                  >
                    Instagram
                  </label>
                  <input
                    type="text"
                    id="instagram"
                    name="instagram"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="Ex: https://instagram.com/..."
                    value={formData.instagram}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="xl:w-[49%]">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                    htmlFor="discord"
                  >
                    Discord
                  </label>
                  <input
                    type="text"
                    id="discord"
                    name="discord"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="Ex: https://discord.gg/..."
                    value={formData.discord}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                  htmlFor="reddit"
                >
                  Reddit
                </label>
                <input
                  type="text"
                  id="reddit"
                  name="reddit"
                  className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                  placeholder="Ex: https://instagram.com/..."
                  required
                  value={formData.reddit}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mb-4">
                <label
                  className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                  htmlFor="description"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="shadow appearance-none border rounded-2xl text-md w-full resize-none py-3 px-3 text-gray-700 leading-tight focus:outline-none"
                  value={formData.description}
                  rows={4}
                  id="description"
                  name="description"
                  placeholder=" Ex: About our project"
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <div className="my-6 flex flex-row justify-center gap-4 text-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setFormStep(1);
                  }}
                  className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                >
                  Back
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    parameterChecks();
                  }}
                  className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {formStep === 3 && (
            <>
              <div>
                {/********* HEADER ******************/}
                <div className="flex flex-col items-start lg:flex-row mb-4 lg:items-center justify-start gap-4 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent text-sm dark:text-white border dark:border-gray-600 rounded-2xl">
                  <img
                    src={formData.logo}
                    alt={formData.title}
                    className="h-6 md:h-14 w-6 md:w-14 rounded-full"
                  />
                  <div>
                    <div className="text-3xl font-semibold">
                      {formData.title}
                    </div>
                    <div className="flex gap-1">
                      {formData.twitter !== "" && (
                        <a
                          href={formData.twitter}
                          target="_blank"
                          className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                        >
                          <RiTwitterXLine />
                        </a>
                      )}
                      {formData.telegram !== "" && (
                        <a
                          href={formData.telegram}
                          target="_blank"
                          className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                        >
                          <RiTelegramLine />
                        </a>
                      )}
                      {formData.facebook !== "" && (
                        <a
                          href={formData.facebook}
                          target="_blank"
                          className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                        >
                          <RiFacebookLine />
                        </a>
                      )}
                      {formData.reddit !== "" && (
                        <a
                          href={formData.reddit}
                          target="_blank"
                          className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                        >
                          <RiRedditLine />
                        </a>
                      )}
                      {formData.discord !== "" && (
                        <a
                          href={formData.discord}
                          target="_blank"
                          className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                        >
                          <RiDiscordLine />
                        </a>
                      )}

                      {formData.website !== "" && (
                        <a
                          href={formData.website}
                          target="_blank"
                          className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                        >
                          <RiGlobalLine />
                        </a>
                      )}
                    </div>
                    <div className="mt-2">{formData.description}</div>
                  </div>
                </div>
                {/********* BODY ******************/}
                <div className="flex flex-col xl:flex-row justify-between gap-4 mb-4 items-center ">
                  {/********* TOKEN INFO ******************/}
                  <div className="w-full xl:w-[70%] p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent text-sm dark:text-white border dark:border-gray-600 rounded-2xl">
                    <h1 className="mb-4 text-lg font-semibold">Token Info</h1>
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Token Address{" "}
                      <div>
                        {makeElipsisAddress(
                          formData.tokenInfo.contract_address,
                          7
                        )}
                        <CopyToClipboard
                          text={formData.tokenInfo.contract_address}
                          onCopy={handleCopy}
                        >
                          <button className="ml-2">
                            {copied ? <FaCheckCircle /> : <FaCopy />}
                          </button>
                        </CopyToClipboard>
                      </div>
                    </div>
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Token Name <div>{formData.tokenInfo.name}</div>
                    </div>
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Token Symbol <div>{formData.tokenInfo.symbol}</div>
                    </div>
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Decimals <div>{formData.tokenInfo.decimals}</div>
                    </div>
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Total Supply{" "}
                      <div>{formatNumber(formData.tokenInfo.total_supply)}</div>
                    </div>
                  </div>
                  {/********* POOL INFO ******************/}
                  <div className="w-full xl:w-[30%] p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent text-sm dark:text-white border dark:border-gray-600 rounded-2xl">
                    <h1 className="mb-4 text-lg font-semibold">Pool Info</h1>

                    <div className="mt-2 pb-2 flex justify-between capitalize items-center border-b dark:border-gray-600">
                      Launchpad Type <div>{formData.launchpadType}</div>
                    </div>
                    <div className="mt-2 pb-2 flex justify-between capitalize items-center border-b dark:border-gray-600">
                      Listing <div>{formData.listingType}</div>
                    </div>
                    {formData.launchpadType == "public" && (
                      <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                        Liquidity <div>{formData.lp_percent}%</div>
                      </div>
                    )}
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Tokens for Presale{" "}
                      <div>{formatNumber(formData.total_token_presale)}</div>
                    </div>
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Total Tokens{" "}
                      <div>{formatNumber(formData.total_token_sale)}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col xl:flex-row justify-between gap-4 items-center ">
                  {/********* PRESALE INFO ******************/}
                  <div className="w-full xl:w-[100%] p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent text-sm dark:text-white border dark:border-gray-600 rounded-2xl">
                    <h1 className="mb-4 text-lg font-semibold">Presale Info</h1>
                    <div className="mt-2 pb-2 flex justify-between items-center border-b capitalize dark:border-gray-600">
                      Presale Type <div>{formData.launchpadType}</div>
                    </div>
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Soft cap{" "}
                      <div className="flex items-center gap-1">
                        {" "}
                        <img
                          src={TonLogo}
                          className="w-4 h-4 rounded-full"
                        />{" "}
                        {formData.soft_cap} TON
                      </div>
                    </div>
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Hard cap{" "}
                      <div className="flex items-center gap-1">
                        {" "}
                        <img
                          src={TonLogo}
                          className="w-4 h-4 rounded-full"
                        />{" "}
                        {formData.hard_cap} TON
                      </div>
                    </div>
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Token Price{" "}
                      <div className="flex items-center gap-1">
                        {" "}
                        <img
                          src={TonLogo}
                          className="w-4 h-4 rounded-full"
                        />{" "}
                        {formData.token_price} TON
                      </div>
                    </div>
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Min buy{" "}
                      <div className="flex items-center gap-1">
                        {" "}
                        <img
                          src={TonLogo}
                          className="w-4 h-4 rounded-full"
                        />{" "}
                        {formData.min_buy} TON
                      </div>
                    </div>
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Max buy{" "}
                      <div className="flex items-center gap-1">
                        {" "}
                        <img
                          src={TonLogo}
                          className="w-4 h-4 rounded-full"
                        />{" "}
                        {formData.max_buy} TON
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="my-6 flex flex-row justify-center gap-4 text-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setFormStep(2);
                  }}
                  className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                >
                  Back
                </button>

                <button className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark">
                  Launch Project
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreatePresale;
