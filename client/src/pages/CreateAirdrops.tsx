import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, Flip } from "react-toastify";
import {
  RiArrowLeftLine,
  RiTwitterXLine,
  RiTelegramLine,
  RiGlobalLine,
  RiFacebookLine,
  RiDiscordLine,
  RiRedditLine,
} from "react-icons/ri";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { getTokenDataNew } from "../helpers/tonApi";
import { formatNumber, makeElipsisAddress } from "../helpers";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaCopy, FaCheckCircle } from "react-icons/fa";
import airdropService from "../api/airdropService";

const CreateAirdrops = () => {
  const navigate = useNavigate();
  const walletAddress = useTonAddress();
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
    tokenAddress: "",
    creatorAddress: walletAddress,
  });
  const [copied, setCopied] = useState(false);
  const [tokenVerify, setTokenVerify] = useState(false);
  const [formStep, setFormStep] = useState(0);

  const [tonConnectUI] = useTonConnectUI();
  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    decimals: "",
    description: "",
    logo: "",
    admin_address: "",
    contract_address: "",
    total_supply: "",
    user_balance: "",
  });
  const [tokenIsLoading, setTokenIsLoading] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    try {
      const data = await airdropService.createAirdrop(formData);
      toast.success("Airdrop created!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
      navigate(`/safe-drop/${data?._id}`);
    } catch (error) {
      console.log(error);
      toast.error("Error creating airdrop!");
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

  const parameterChecks = () => {
    if (formStep == 0) {
      if (formData.tokenInfo?.name == "") {
        toast.error(`Invalis token data`, {
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
        setFormStep(1);
      }
    }

    if (formStep == 1) {
      if (formData.title == "") {
        toast.error(`You must add airdrop name`, {
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
        setFormStep(2);
        console.log(formData);
      }
    }
  };

  return (
    <div className="flex flex-col w-full mb-24  justify-center mx-auto rounded-2xl py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white">
      {/* Header */}
      <div className="my-4">
        <p className="font-black tracking-wide text-2xl lg:text-3xl mb-1 flex gap-3 items-center">
          <div onClick={() => navigate(-1)}>
            {" "}
            <RiArrowLeftLine size="25px" />
          </div>
          Launch Airdrop
        </p>
      </div>

      <div className="w-full flex flex-col justify-center">
        <div className="mt-2 mb-4">
          <ol className="flex items-center w-full p-3 space-x-2 text-sm font-medium text-center text-gray-500 bg-white border border-gray-200 rounded-2xl shadow-sm dark:text-gray-400 sm:text-base dark:bg-black dark:border-gray-700 sm:p-4 sm:space-x-4 rtl:space-x-reverse">
            <li
              className={`flex items-center ${
                (formStep === 1 || formStep === 2) &&
                "text-safemoon-dark dark:text-white"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ${
                  formStep === 1 || formStep === 2
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
                formStep === 2 && "text-safemoon-dark dark:text-white"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ${
                  formStep === 2
                    ? "dark:border-white border-safemoon-dark"
                    : "border-gray-500 dark:border-gray-400"
                }`}
              >
                2
              </span>
              <span>
                <h3 className="font-medium leading-tight text-start">
                  Airdrop Info{" "}
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
                formStep === 3 && "text-safemoon-dark dark:text-white"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ${
                  formStep === 3
                    ? "dark:border-white border-safemoon-dark"
                    : "border-gray-500 dark:border-gray-400"
                }`}
              >
                3
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
          {/* STEP 1 */}
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
              {tokenVerify && tokenData.name !== "" ? (
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
              ) : null}
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
                      {tokenData.user_balance == "0" ? (
                        <div className="my-10 text-center">
                          You do not have any {tokenData.symbol} in your wallet.
                        </div>
                      ) : (
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

          {/* STEP 2 */}
          {formStep === 1 && (
            <>
              <div className="mb-4">
                <label
                  className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                  htmlFor="symbol"
                >
                  Airdrop Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                  placeholder="Ex: Safe Moon Airdrop"
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
                    Logo URL
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="logo"
                    name="logo"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 pr-2 pl-4 text-gray-700 leading-tight focus:outline-none"
                    placeholder="Ex: https://..."
                    value={formData.logo}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="xl:w-[49%]">
                  <label
                    className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2"
                    htmlFor="website"
                  >
                    Website
                    <span className="text-red-500">*</span>
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
                  Description
                </label>
                <textarea
                  className="shadow appearance-none border rounded-2xl text-md w-full resize-none py-3 px-3 text-gray-700 leading-tight focus:outline-none"
                  value={formData.description}
                  rows={4}
                  id="description"
                  name="description"
                  placeholder=" Ex: About our airdrop"
                  onChange={handleInputChange}
                ></textarea>
              </div>

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
                  <div className="w-full p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent text-sm dark:text-white border dark:border-gray-600 rounded-2xl">
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
                </div>
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
                    handleSubmit();
                  }}
                  className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                >
                  Create Airdrop
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateAirdrops;
