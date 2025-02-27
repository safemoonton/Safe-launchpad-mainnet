import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  RiArrowLeftLine,
  RiTwitterXLine,
  RiTelegramLine,
  RiGlobalLine,
  RiFacebookLine,
  RiDiscordLine,
  RiRedditLine,
} from "react-icons/ri";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaCopy, FaCheckCircle } from "react-icons/fa";
import lockService from "../api/lockService";
import icoService from "../api/icoService";
import Timer from "../components/Timer";
import { formatNumber, makeElipsisAddress, formatDateTime } from "../helpers";
import TokenomicsPieChart from "../components/TokenomicsPieChart";
import { toast, Flip } from "react-toastify";
//@ts-ignore
import TonLogo from "../assets/images/ton-logo.png";
import LockHistoryTable from "../components/LockHistoryTable";
import PublicLaunchpadAdmin from "../components/PublicLaunchpadAdmin";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import SetTimeModal from "../components/SetTimeModal";
import SetDEXTimeModal from "../components/setDEXTimeModal";
import CancelSaleModal from "../components/CancelSaleModal";
import BuySaleModal from "../components/BuySaleModal";
import ClaimFundsModal from "../components/ClaimFundsModal";
import ReclaimModal from "../components/ReclaimModal";
import { Address, beginCell } from "ton-core";
import { toNano } from "@ton/core";
import { isAfter } from "date-fns";

const LaunchpadDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [modalType, setModalType] = useState(null);
  const [launchpadData, setLaunchpadData] = useState(null);
  const [contribution, setContribution] = useState([]);
  const [myContribution, setMyContribution] = useState([]);
  const [amount, setAmount] = useState(0);
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);
  const [status, setStatus] = useState("Upcoming");
  const [lockHistory, setLockHistory] = useState(null);
  const [lockedTokens, setLockedTokens] = useState(0);
  const [uniqueContributors, setUniqueContributors] = useState(0);
  const [allContribution, setAllContribution] = useState(0);
  const [userTotalContribution, setUserTotalContribution] = useState(0);

  useEffect(() => {
    getData(id);
  }, [id, walletAddress]);

  const handleCopy1 = () => {
    setCopied1(true);
    setTimeout(() => setCopied1(false), 2000);
  };

  const handleCopy2 = () => {
    setCopied2(true);
    setTimeout(() => setCopied2(false), 2000);
  };

  async function getData(id) {
    try {
      const data = await icoService.getICO(id);
      setLaunchpadData(data);

      const currentTime = new Date().getTime();
      const start = new Date(data.start).getTime();
      const end = new Date(data.end).getTime();

      if (data.isCancelled) {
        setStatus("Cancelled");
      } else {
        if (currentTime < start) {
          setStatus("Upcoming");
        } else if (currentTime >= start && currentTime <= end) {
          setStatus("Active");
        } else if (currentTime > end) {
          setStatus("Ended");
        }
      }

      getContributors(data._id);
      getLockHistory(data.tokenInfo.contract_address);
    } catch (error) {
      console.error(error);
      toast.error(`Error getting ICO`, {
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

  const handleModal = (type) => {
    setModalType(type === modalType ? null : type);
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    // Limit input to 10 characters
    if (inputValue.length <= 10) {
      setAmount(inputValue);
    }
  };

  const handleBuy = () => {
    const overflow = Number(amount) + Number(allContribution);
    if (amount > Number(launchpadData.max_buy)) {
      toast.error(`Amount cannot be greater than ${launchpadData.max_buy} TON`);
      return;
    } else if (amount < Number(launchpadData.min_buy)) {
      toast.error(`Amount cannot be lower than ${launchpadData.min_buy} TON`);
      return;
    } else if (Number(userTotalContribution) >= Number(launchpadData.max_buy)) {
      toast.error(
        `You cannot contribute more than ${launchpadData.max_buy} TON`
      );
      return;
    } else if (overflow > Number(launchpadData.hard_cap)) {
      toast.error(
        `You cannot contribute more than ${
          Number(launchpadData.hard_cap) - Number(allContribution)
        } TON`
      );
      return;
    } else {
      setModalType("purchase");
    }
  };

  async function getLockHistory(tokenAddress) {
    const data = await lockService.getLockByToken(tokenAddress);

    //console.log(data);
    setLockHistory(data);
    setLockedTokens(combineAmounts(data));
  }

  async function getContributors(id) {
    const data = await icoService.getPurchasesByICO(id);
    setContribution(data);

    if (walletAddress) {
      const userContributions = data.filter(
        (contribution) => contribution.userId == walletAddress
      );
      const totalContribution = userContributions.reduce(
        (total, contribution) => total + Number(contribution.amount),
        0
      );
      setUserTotalContribution(totalContribution);
      setMyContribution(userContributions);
    }

    const totalContribution = data.reduce(
      (total, contribution) => total + Number(contribution.amount),
      0
    );
    setAllContribution(totalContribution);

    const uniqueContributorsSet = new Set(
      data.map((contribution) => contribution.userId)
    );
    setUniqueContributors(uniqueContributorsSet.size);
  }

  function combineAmounts(data) {
    if (!Array.isArray(data)) {
      throw new TypeError("Input data must be an array");
    }

    return data
      .filter((item) => item.claimed === false) // Filter out items where claimed is false
      .reduce((total, item) => {
        if (typeof item.amount !== "number") {
          throw new TypeError(
            "Each item in the array must have a numeric 'amount' property"
          );
        }
        return total + item.amount;
      }, 0);
  }

  const updateICOTimes = async (startTime, endTime) => {
    let newFormData = {
      ...launchpadData,
      start: startTime,
      end: endTime,
    };
    const dataUpdate = await icoService.updateICO(newFormData._id, newFormData);
    setModalType(null);
    getData(id);
  };

  const updateDEXTimes = async (time) => {
    let newFormData = {
      ...launchpadData,
      dexTime: time,
    };
    const dataUpdate = await icoService.updateICO(newFormData._id, newFormData);
    setModalType(null);
    getData(id);
  };

  const cancelSale = async () => {
    let newFormData = { ...launchpadData, isCancelled: true };
    const dataUpdate = await icoService.updateICO(newFormData._id, newFormData);
    setModalType(null);
    getData(id);
  };

  async function purchase() {
    let buyBody = beginCell()
      .storeUint(0x86c74136, 32) // op::contribute
      .storeUint(0, 64) // query_id
      .endCell();

    let buyPayload = buyBody.toBoc().toString("base64");

    try {
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: launchpadData.launchpadAddress,
            amount: toNano(amount).toString(),
            payload: buyPayload,
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      });
      if (result?.boc !== undefined) {
        const newFormData = {
          userId: walletAddress,
          icoId: launchpadData._id,
          amount: amount,
        };
        const dataUpdate = await icoService.createPurchase(newFormData);
        setModalType(null);
        getData(id);
        setTimeout(() => {
          toast.success("Sale Completed!");
        }, 3000);
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Error participating in sale: ${err.message}`);
      }
    }
  }

  async function claim(data) {
    let claimBody = beginCell()
      .storeUint(0x578710cd, 32) // op::claim_tokens
      .storeUint(0, 64) // query_id
      .storeAddress(Address.parse(launchpadData.launchpadWalletAddress))
      .storeCoins(toNano(Number(data.amount) * 1000000000))
      .endCell();

    let claimPayload = claimBody.toBoc().toString("base64");

    try {
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: launchpadData.launchpadAddress,
            amount: toNano("0.1").toString(),
            payload: claimPayload,
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      });
      if (result?.boc !== undefined) {
        const newFormData = {
          ...data,
          isClaimed: true,
        };
        const dataUpdate = await icoService.updatePurchase(
          data._id,
          newFormData
        );
        getData(id);
        setTimeout(() => {
          toast.success("Claimed successfully!");
        }, 3000);
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Error claiming tokens: ${err.message}`);
      }
    }
  }

  async function claimRefunds(data) {
    let claimBody = beginCell()
      .storeUint(0xc135f40c, 32) // op::refund
      .storeUint(0, 64) // query_id
      .storeCoins(toNano(Number(data)))
      .endCell();

    let claimPayload = claimBody.toBoc().toString("base64");

    try {
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: launchpadData.launchpadAddress,
            amount: toNano("0.1").toString(),
            payload: claimPayload,
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      });
      if (result?.boc !== undefined) {
        const newFormData = {
          ...data,
          isClaimed: true,
        };
        const dataUpdate = await icoService.updatePurchase(
          data._id,
          newFormData
        );
        getData(id);
        setTimeout(() => {
          toast.success("Refunding successfully!");
        }, 3000);
        location.reload();
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Error claiming tokens: ${err.message}`);
      }
    }
  }

  async function claimFunds() {
    let claimBody = beginCell()
      .storeUint(0xb99d744b, 32) // op::claim_funds
      .storeUint(0, 64) // query_id
      .endCell();

    let claimPayload = claimBody.toBoc().toString("base64");

    try {
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: launchpadData.launchpadAddress,
            amount: toNano("0.1").toString(),
            payload: claimPayload,
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      });
      if (result?.boc !== undefined) {
        const newFormData = {
          ...launchpadData,
          isClaimedRaise: true,
        };
        const dataUpdate = await icoService.updateICO(
          launchpadData._id,
          newFormData
        );
        setModalType(null);
        getData(id);
        setTimeout(() => {
          toast.success("Funds claimed successfully!");
        }, 3000);
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Error claiming funds: ${err.message}`);
      }
    }
  }

  async function reclaim() {
    let amount =
      Number(launchpadData.total_token_sale) -
      Number(allContribution) / Number(launchpadData.token_price);

    let claimBody = beginCell()
      .storeUint(0x578710cd, 32) // op::claim_tokens
      .storeUint(0, 64) // query_id
      .storeAddress(Address.parse(launchpadData.launchpadWalletAddress))
      .storeCoins(
        toNano(
          Number(amount.toFixed(0)) *
            1000000000 *
            Number(launchpadData.token_price)
        )
      )
      .endCell();

    let claimPayload = claimBody.toBoc().toString("base64");

    try {
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: launchpadData.launchpadAddress,
            amount: toNano("0.1").toString(),
            payload: claimPayload,
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      });
      if (result?.boc !== undefined) {
        const newFormData = {
          ...launchpadData,
          isClaimedLeftover: true,
        };
        const dataUpdate = await icoService.updateICO(
          launchpadData._id,
          newFormData
        );
        setModalType(null);
        getData(id);
        setTimeout(() => {
          toast.success("Tokens released successfully!");
        }, 3000);
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Error releasing tokens: ${err.message}`);
      }
    }
  }

  async function autolist(data) {
    const newFormData = {
      ...launchpadData,
      isEnableListing: true,
      listingPlatform: data,
    };
    try {
      const dataUpdate = await icoService.updateICO(
        launchpadData._id,
        newFormData
      );
      setModalType(null);
      getData(id);
      toast.success("Auto-Listing Requested");
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Error while requesting Auto-Listing: ${err.message}`);
      }
    }
  }

  return (
    <>
      <div className="flex flex-col w-full mb-24  justify-center mx-auto rounded-2xl py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white ">
        <div className="my-4">
          <p className="font-black tracking-wide text-2xl lg:text-3xl mb-1 flex gap-3 items-center">
            <div className="cursor-pointer" onClick={() => navigate(-1)}>
              {" "}
              <RiArrowLeftLine size="25px" />
            </div>
            Launchpad Details
          </p>
        </div>

        {launchpadData != null ? (
          <>
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="lg:w-2/3 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                <div className="flex justify-between">
                  <div className="flex flex-col items-start lg:flex-row lg:items-center justify-start gap-4">
                    <img
                      src={launchpadData.logo}
                      alt={launchpadData.title}
                      className="h-6 md:h-14 w-6 md:w-14 rounded-full"
                    />
                    <div>
                      <div className="text-3xl font-semibold">
                        {launchpadData.title}
                      </div>
                      <div className="flex gap-1">
                        {launchpadData.twitter !== "" && (
                          <a
                            href={launchpadData.twitter}
                            target="_blank"
                            className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                          >
                            <RiTwitterXLine />
                          </a>
                        )}
                        {launchpadData.telegram !== "" && (
                          <a
                            href={launchpadData.telegram}
                            target="_blank"
                            className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                          >
                            <RiTelegramLine />
                          </a>
                        )}
                        {launchpadData.facebook !== "" && (
                          <a
                            href={launchpadData.facebook}
                            target="_blank"
                            className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                          >
                            <RiFacebookLine />
                          </a>
                        )}
                        {launchpadData.reddit !== "" && (
                          <a
                            href={launchpadData.reddit}
                            target="_blank"
                            className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                          >
                            <RiRedditLine />
                          </a>
                        )}
                        {launchpadData.discord !== "" && (
                          <a
                            href={launchpadData.discord}
                            target="_blank"
                            className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                          >
                            <RiDiscordLine />
                          </a>
                        )}

                        {launchpadData.website !== "" && (
                          <a
                            href={launchpadData.website}
                            target="_blank"
                            className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                          >
                            <RiGlobalLine />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-1 px-2 h-6 flex justify-center items-center text-[0.6rem] rounded-full font-semibold ${
                      status == "Active"
                        ? "border-green-600 text-green-600 bg-green-100"
                        : status == "Ended"
                        ? "border-red-600 text-red-600 bg-red-100"
                        : status == "Upcoming"
                        ? "border-yellow-900 text-yellow-900 bg-yellow-100"
                        : "border-gray-600 text-gray-600 bg-gray-100"
                    } `}
                  >
                    {status}
                  </div>
                </div>
                <div>
                  <div className="my-4 pb-2">{launchpadData.description}</div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Presale Address{" "}
                    <div>
                      {" "}
                      {makeElipsisAddress(launchpadData.launchpadAddress, 7)}
                      <CopyToClipboard
                        text={launchpadData.launchpadAddress}
                        onCopy={handleCopy1}
                      >
                        <button className="ml-2">
                          {copied1 ? <FaCheckCircle /> : <FaCopy />}
                        </button>
                      </CopyToClipboard>
                    </div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Token Name <div> {launchpadData.tokenInfo.name}</div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Token Address{" "}
                    <div>
                      {" "}
                      {makeElipsisAddress(launchpadData.tokenAddress, 7)}
                      <CopyToClipboard
                        text={launchpadData.tokenAddress}
                        onCopy={handleCopy2}
                      >
                        <button className="ml-2">
                          {copied2 ? <FaCheckCircle /> : <FaCopy />}
                        </button>
                      </CopyToClipboard>
                    </div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Token Symbol <div>{launchpadData.tokenInfo.symbol}</div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Token Decimals <div>{launchpadData.tokenInfo.decimals}</div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Total Supply{" "}
                    <div>
                      {formatNumber(launchpadData.tokenInfo.total_supply)}{" "}
                      {launchpadData.tokenInfo.symbol}
                    </div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Tokens For Presale{" "}
                    <div>
                      {formatNumber(launchpadData.total_token_sale)}{" "}
                      {launchpadData.tokenInfo.symbol}
                    </div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Soft Cap{" "}
                    <div className="flex items-center gap-1">
                      {" "}
                      <img
                        src={TonLogo}
                        className="w-4 h-4 rounded-full"
                      />{" "}
                      {launchpadData.soft_cap} TON
                    </div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Hard Cap{" "}
                    <div className="flex items-center gap-1">
                      {" "}
                      <img
                        src={TonLogo}
                        className="w-4 h-4 rounded-full"
                      />{" "}
                      {launchpadData.hard_cap} TON
                    </div>
                  </div>
                  {launchpadData.start !== undefined && (
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Start Time{" "}
                      <div>{formatDateTime(launchpadData.start)} (UTC)</div>
                    </div>
                  )}
                  {launchpadData.end !== undefined && (
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      End Time{" "}
                      <div>{formatDateTime(launchpadData.end)} (UTC)</div>
                    </div>
                  )}
                  {launchpadData.launchpadType == "public" && (
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Liquidity Percent <div>{launchpadData.lp_percent}%</div>
                    </div>
                  )}
                  {launchpadData.isAutoListed == true && (
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Listing{" "}
                      <div className="text-blue-400">
                        <a href={launchpadData.listingUrl} target="blank">
                          {launchpadData.listingPlatform}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:w-1/3">
                {/* ADMIN CONTROL */}
                {walletAddress &&
                  launchpadData?.creatorAddress == walletAddress && (
                    <PublicLaunchpadAdmin
                      launchpadData={launchpadData}
                      contribution={contribution}
                      allContribution={allContribution}
                      status={status}
                      handleModal={handleModal}
                    />
                  )}
                {/* CONTRIBUTOR CONTROL */}
                {status == "Upcoming" && (
                  <>
                    {walletAddress &&
                      launchpadData.creatorAddress !== walletAddress && (
                        <div className="mt-4 mb-4 lg:mt-0 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                          <p className="mb-2">Presale starts in:</p>
                          {launchpadData.start && (
                            <Timer
                              startTime={launchpadData.start}
                              endTime={launchpadData.end}
                            />
                          )}

                          <div className="flex flex-col gap-2 mt-4">
                            <div className="flex flex-row justify-between items-center">
                              <div>{allContribution} TON</div>
                              <div>{launchpadData.hard_cap} TON</div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{
                                  width: `${
                                    (Number(allContribution) /
                                      Number(launchpadData.hard_cap)) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                  </>
                )}
                {status == "Active" && (
                  <>
                    {walletAddress &&
                      launchpadData.creatorAddress !== walletAddress && (
                        <div className="mt-4 mb-4 lg:mt-0 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                          <p className="mb-2">Presale ends in:</p>
                          {launchpadData.start && (
                            <Timer
                              startTime={launchpadData.start}
                              endTime={launchpadData.end}
                            />
                          )}

                          <div className="flex flex-col gap-2 mt-4">
                            <div className="flex flex-row justify-between items-center">
                              <div>{allContribution} TON</div>
                              <div>{launchpadData.hard_cap} TON</div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{
                                  width: `${
                                    (Number(allContribution) /
                                      Number(launchpadData.hard_cap)) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {walletAddress ? (
                            <div>
                              <h2 className="font-semibold mt-4 mb-2">
                                Amount
                              </h2>
                              <div className="flex items-center">
                                <div className="py-4 px-4 rounded-2xl focus:outline-none focus:border-gray-400 text-gray-400 text-md bg-safemoon-dark font-medium w-full outline-none dark:text-white dark:bg-white/10 flex flex-row">
                                  <input
                                    id="amountInput"
                                    type="number"
                                    value={amount}
                                    onChange={handleChange}
                                    className=" w-full h-full mr-2 outline-none bg-transparent dark:bg-transparent focus:bg-transparent"
                                  />
                                </div>
                              </div>
                              <div className="mt-2 text-xs flex flex-row justify-between">
                                <p>Min: {launchpadData.min_buy} TON</p>
                                <p>Max: {launchpadData.max_buy} TON</p>
                              </div>
                              <button
                                onClick={handleBuy}
                                className="mt-2 py-4 cursor-pointer text-center px-4 rounded-2xl border text-xs xl:text-sm font-medium dark:bg-black dark:hover:bg-white/10 hover:text-safemoon-dark hover:bg-white dark:hover:text-white text-white bg-gray-600 w-full dark:text-gray-300 hover:shadow-sm"
                              >
                                Buy
                              </button>
                            </div>
                          ) : (
                            <div className="mt-4 flex justify-center items-center">
                              <p>Connect your wallet</p>
                            </div>
                          )}
                        </div>
                      )}
                  </>
                )}{" "}
                {status == "Ended" && (
                  <>
                    {walletAddress &&
                      launchpadData.creatorAddress !== walletAddress && (
                        <div className="mt-4 mb-4 lg:mt-0 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                          <p className="mb-2">Presale has ended</p>

                          <div className="flex flex-col gap-2 mt-4">
                            <div className="flex flex-row justify-between items-center">
                              <div>{allContribution} TON</div>
                              <div>{launchpadData.hard_cap} TON</div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{
                                  width: `${
                                    (Number(allContribution) /
                                      Number(launchpadData.hard_cap)) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {walletAddress ? (
                            <>
                              {Number(allContribution) >=
                              Number(launchpadData.soft_cap) ? (
                                <>
                                  {isAfter(
                                    new Date(),
                                    new Date(launchpadData.dexTime)
                                  ) && launchpadData.isAutoListed == true ? (
                                    <>
                                      {myContribution.length > 0 &&
                                        myContribution.map(
                                          (contribution, index) => (
                                            <div className="mt-4" key={index}>
                                              {!contribution.isClaimed && (
                                                <button
                                                  onClick={() =>
                                                    claim(contribution)
                                                  }
                                                  className="mb-1 py-2 sm:py-2 px-5 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                                                >
                                                  Claim{" "}
                                                  {(
                                                    Number(
                                                      contribution.amount
                                                    ) /
                                                    Number(
                                                      launchpadData.token_price
                                                    )
                                                  ).toFixed(2)}{" "}
                                                  {
                                                    launchpadData.tokenInfo
                                                      .symbol
                                                  }
                                                </button>
                                              )}
                                            </div>
                                          )
                                        )}
                                    </>
                                  ) : (
                                    <p className="mt-4">
                                      {launchpadData.tokenInfo.symbol}'s Sale
                                      has ended.{" "}
                                      {launchpadData.dexTime == null
                                        ? "Token listing time will be updated shortly"
                                        : `Tokens will be listed on DEX on
                                    ${formatDateTime(
                                      launchpadData.dexTime
                                    )}(UTC)`}{" "}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="mt-4">
                                    {launchpadData.tokenInfo.symbol}'s Sale
                                    failed to reach Soft Cap of{" "}
                                    {launchpadData.soft_cap} TON.
                                  </p>
                                  {myContribution.length > 0 &&
                                    myContribution.map(
                                      (contribution, index) => (
                                        <div className="mt-4" key={index}>
                                          {!contribution.isClaimed && (
                                            <button
                                              onClick={() =>
                                                claimRefunds(
                                                  contribution.amount
                                                )
                                              }
                                              className="mt-4 py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                                            >
                                              Claim Refund{"  "}
                                              {Number(
                                                contribution.amount
                                              ).toFixed(2)}{" "}
                                              TON
                                            </button>
                                          )}
                                        </div>
                                      )
                                    )}
                                </>
                              )}
                            </>
                          ) : (
                            <div className="mt-4 flex justify-center items-center">
                              <p>Connect your wallet</p>
                            </div>
                          )}
                        </div>
                      )}
                  </>
                )}
                {/* LAUNCHPAD DETAILS */}
                <div className="mb-4 p-4 rounded-2xl border dark:border-gray-600 bg-white text-safemoon-dark dark:bg-transparent dark:text-white">
                  <div className="mt-2 pb-2 flex justify-between items-center ">
                    Status <div>{status}</div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center ">
                    Type{" "}
                    <div className="capitalize">
                      {launchpadData.launchpadType}
                    </div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center ">
                    Rate{" "}
                    <div>
                      1 {launchpadData.tokenInfo.symbol} ={" "}
                      {launchpadData.token_price} TON
                    </div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center ">
                    Total Contributors <div>{uniqueContributors}</div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center ">
                    Your Contribution <div>{userTotalContribution} TON</div>
                  </div>
                </div>
              </div>
            </div>

            {walletAddress &&
              launchpadData.creatorAddress == walletAddress &&
              contribution.length > 0 && (
                <div className="mb-4 md:mb-6 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                  <div className="font-semibold text-lg">
                    {launchpadData.tokenInfo.name}'s Sale Contributions
                  </div>
                  {status == "Active" && (
                    <div className="text-red-500 text-xs">
                      {" "}
                      Contributors can claim {
                        launchpadData.tokenInfo.symbol
                      }{" "}
                      after token has been listed
                    </div>
                  )}
                  <div class="table w-full my-4">
                    <div class="table-header-group ...">
                      <div class="table-row">
                        <div class="table-cell text-center font-semibold p-4 pr-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 ">
                          {" "}
                          Address
                        </div>
                        <div class="table-cell text-center font-semibold p-4 pr-8 pt-0 pb-3 text-slate-400 dark:text-slate-200">
                          {" "}
                          Amount (TON)
                        </div>
                        <div class="table-cell text-center font-semibold p-4 pr-8 pt-0 pb-3 text-slate-400 dark:text-slate-200">
                          {" "}
                          Claimed
                        </div>
                      </div>
                    </div>
                    <div class="table-row-group">
                      {contribution.map((record, index) => (
                        <div
                          key={index}
                          class="table-row even:bg-black/10 odd:bg-black/20 dark:even:bg-white/10 dark:odd:bg-black/10"
                        >
                          <div class="table-cell px-4 text-center  py-2">
                            {makeElipsisAddress(record.userId, 6)}
                          </div>
                          <div class="table-cell px-4 text-center  py-2">
                            {" "}
                            {record.amount}
                          </div>
                          <div class="table-cell px-4 text-center  py-2">
                            {" "}
                            {record.isClaimed ? "Yes" : "No"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {myContribution.length > 0 && (
              <div className="mb-4 md:mb-6 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                <div className="font-semibold text-lg">Your Contributions</div>
                {status == "Active" && (
                  <div className="text-red-500 text-xs">
                    {" "}
                    You can claim your {launchpadData.tokenInfo.symbol} after
                    token has been listed
                  </div>
                )}
                <div class="table w-full my-4">
                  <div class="table-header-group ...">
                    <div class="table-row">
                      <div class="table-cell text-center font-semibold p-4 pr-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 ">
                        {" "}
                        Address
                      </div>
                      <div class="table-cell text-center font-semibold p-4 pr-8 pt-0 pb-3 text-slate-400 dark:text-slate-200">
                        {" "}
                        Amount (TON)
                      </div>
                      <div class="table-cell text-center font-semibold p-4 pr-8 pt-0 pb-3 text-slate-400 dark:text-slate-200">
                        {" "}
                        Claimed
                      </div>
                    </div>
                  </div>
                  <div class="table-row-group">
                    {myContribution.map((record, index) => (
                      <div
                        key={index}
                        class="table-row even:bg-black/10 odd:bg-black/20 dark:even:bg-white/10 dark:odd:bg-black/10"
                      >
                        <div class="table-cell px-4 text-center  py-2">
                          {makeElipsisAddress(record.userId, 6)}
                        </div>
                        <div class="table-cell px-4 text-center  py-2">
                          {" "}
                          {record.amount}
                        </div>
                        <div class="table-cell px-4 text-center  py-2">
                          {" "}
                          {record.isClaimed &&
                          Number(allContribution) <
                            Number(launchpadData.soft_cap)
                            ? "Refunded"
                            : record.isClaimed
                            ? "Yes"
                            : "No"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4 md:mb-6 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
              <div className="font-semibold text-lg">Tokenomics</div>
              <div className="flex justify-center items-center">
                <TokenomicsPieChart
                  launchpadData={launchpadData}
                  lockedTokens={lockedTokens}
                />
              </div>
            </div>

            {lockHistory?.length > 0 && (
              <div className="mb-4 md:mb-6 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                <div className="font-semibold text-lg">
                  {launchpadData.tokenInfo.name}'s Lock History
                </div>

                <LockHistoryTable lockHistory={lockHistory} />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="lg:w-2/3 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl animate-pulse">
              <div className="flex justify-between">
                <div className="flex flex-col items-start lg:flex-row lg:items-center justify-start gap-4">
                  <div className="h-6 md:h-14 w-6 md:w-14 rounded-full bg-gray-300"></div>
                  <div>
                    <div className="text-3xl font-semibold bg-gray-300 h-8 w-40 rounded-2xl"></div>
                    <div className="flex gap-1 mt-2">
                      {[...Array(6)].map((_, index) => (
                        <div
                          key={index}
                          className="h-[1.5rem] w-[1.5rem] rounded-2xl bg-gray-300"
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-1 px-2 h-6 flex justify-center items-center text-[0.6rem] rounded-full font-semibold bg-gray-300 w-24"></div>
              </div>
              <div>
                <div className="my-4 pb-2 bg-gray-300 h-6 w-full rounded-2xl"></div>
                {[
                  "Presale Address",
                  "Token Name",
                  "Token Address",
                  "Token Symbol",
                  "Token Decimals",
                  "Total Supply",
                  "Tokens For Presale",
                  "Tokens For Liquidity",
                  "Initial Market Cap (estimate)",
                  "Soft Cap",
                  "TON Limit per user",
                  "Presale Start Time",
                  "Presale End Time",
                  "Listing On",
                  "Liquidity Percent",
                ].map((label, index) => (
                  <div
                    key={index}
                    className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600"
                  >
                    <div className="bg-gray-300 h-6 w-40 rounded-2xl"></div>
                    <div className="bg-gray-300 h-6 w-64 rounded-2xl"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/3 mt-4 lg:mt-0 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl animate-pulse">
              <p className="mb-2 bg-gray-300 h-6 w-40 rounded-2xl"></p>
              <div className="bg-gray-300 h-12 w-full rounded-2xl"></div>
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex flex-row justify-between items-center">
                  <div className="bg-gray-300 h-6 w-24 rounded-2xl"></div>
                  <div className="bg-gray-300 h-6 w-24 rounded-2xl"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-gray-300 h-2.5 rounded-full"
                    style={{ width: "50%" }}
                  ></div>
                </div>
              </div>

              <div className="mt-4">
                <h2 className="font-semibold mt-4 mb-2 bg-gray-300 h-6 w-24 rounded-2xl"></h2>
                <div className="flex items-center">
                  <div className="py-4 px-4 rounded-2xl bg-gray-300 h-12 w-full"></div>
                </div>
                <button className="mt-2 py-4 bg-gray-300 h-12 w-full rounded-2xl"></button>
              </div>

              <div className="mt-4 p-2 rounded-2xl border dark:border-gray-600">
                {[
                  "Status",
                  "Sale Type",
                  "Current Rate",
                  "Total Contributors",
                  "Your Claimed",
                ].map((label, index) => (
                  <div
                    key={index}
                    className="mt-2 pb-2 flex justify-between items-center"
                  >
                    <div className="bg-gray-300 h-6 w-40 rounded-2xl"></div>
                    <div className="bg-gray-300 h-6 w-24 rounded-2xl"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {modalType === "setTime" && (
        <SetTimeModal
          launchpadData={launchpadData}
          closeModal={() => setModalType(null)}
          updateICOTimes={updateICOTimes}
        />
      )}
      {modalType === "setDEXTime" && (
        <SetDEXTimeModal
          launchpadData={launchpadData}
          closeModal={() => setModalType(null)}
          updateDEXTimes={updateDEXTimes}
        />
      )}
      {modalType === "cancelSale" && (
        <CancelSaleModal
          closeModal={() => setModalType(null)}
          cancelSale={cancelSale}
        />
      )}
      {modalType === "purchase" && (
        <BuySaleModal
          closeModal={() => setModalType(null)}
          purchase={purchase}
        />
      )}
      {modalType === "claimFunds" && (
        <ClaimFundsModal
          totalContribution={allContribution}
          closeModal={() => setModalType(null)}
          claimFunds={claimFunds}
        />
      )}
      {modalType === "reclaim" && (
        <ReclaimModal closeModal={() => setModalType(null)} reclaim={reclaim} />
      )}
      {modalType === "autolist" && (
        <AutoListModal
          closeModal={() => setModalType(null)}
          autolist={autolist}
        />
      )}
    </>
  );
};

const AutoListModal = ({ closeModal, autolist }) => {
  const [selectedPlatform, setSelectedPlatform] = useState("stonfi");

  const handlePlatformChange = (event) => {
    setSelectedPlatform(event.target.value);
  };

  const handleContinue = () => {
    autolist(selectedPlatform);
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-600 bg-opacity-75 z-50">
      <div className="text-safemoon-alt  px-4 md:px-4 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-xl w-[90%] mt-20 z-[1000]">
        <h2 className="text-base md:text-lg font-semibold mb-4">Listing</h2>
        <p className="mb-4 tracking-wide text-sm">
          Select your preferred listing platform.
          <br /> <br />
          Note that your remaining TON will be sent to the presale creator's
          address after listing has been completed along with any remaining
          tokens.
        </p>
        <div className="mb-4">
          <label
            htmlFor="platform"
            className="block text-sm font-medium text-white"
          >
            Select Platform
          </label>
          <select
            id="platform"
            value={selectedPlatform}
            onChange={handlePlatformChange}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 text-safemoon-dark bg-white rounded-2xl focus:outline-none  sm:text-sm"
          >
            <option value="stonfi" selected>
              STON.fi
            </option>
            <option value="dedust">DeDust.io</option>
          </select>
        </div>
        <div className="flex gap-4 flex-wrap">
          <button
            className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-red-500 dark:hover:bg-red-700 text-white bg-red-500 dark:hover:text-white hover:text-white hover:bg-red-700 dark:text-white"
            onClick={() => closeModal(null)}
          >
            Close
          </button>
          <button
            className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-white/30 dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/50 dark:text-gray-300"
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaunchpadDetails;
