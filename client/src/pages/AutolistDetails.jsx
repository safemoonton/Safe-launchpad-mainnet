import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import icoService from "../api/icoService";
import { formatNumber, makeElipsisAddress, formatDateTime } from "../helpers";
import { toast, Flip } from "react-toastify";
//@ts-ignore
import TonLogo from "../assets/images/ton-logo.png";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import ReclaimModal from "../components/ReclaimModal";
import { Address, beginCell } from "ton-core";
import { toNano } from "@ton/core";
import AutoListAdmin from "../components/AutoListAdmin";

const AutolistDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [modalType, setModalType] = useState(null);
  const [launchpadData, setLaunchpadData] = useState(null);
  const [contribution, setContribution] = useState([]);
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);
  const [status, setStatus] = useState("Upcoming");
  const [allContribution, setAllContribution] = useState(0);

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

      const isAutoListed = data.isAutoListed;

      if (isAutoListed == true) {
        setStatus("Listed");
      } else {
        setStatus("Not Listed");
      }
      getContributors(data._id);
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

  async function getContributors(id) {
    const data = await icoService.getPurchasesByICO(id);
    setContribution(data);

    const totalContribution = data.reduce(
      (total, contribution) => total + Number(contribution.amount),
      0
    );
    setAllContribution(totalContribution);
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
          (
            Number(amount) *
            1000000000 *
            Number(launchpadData.token_price)
          ).toString()
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
      isAutoListed: true,
      listingUrl: data,
    };
    try {
      const dataUpdate = await icoService.updateICO(
        launchpadData._id,
        newFormData
      );
      setModalType(null);
      getData(id);
      toast.success("Auto-Listing Updated");
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Error updating Auto-Listing: ${err.message}`);
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
            Auto-List Details
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
                      status == "Listed"
                        ? "border-green-600 text-green-600 bg-green-100"
                        : status == "Not Listed"
                        ? "border-red-600 text-red-600 bg-red-100"
                        : null
                    } `}
                  >
                    {status}
                  </div>
                </div>
                <div>
                  <div className="my-4 pb-2">{launchpadData.description}</div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Creator Address{" "}
                    <div>
                      {" "}
                      {makeElipsisAddress(launchpadData.creatorAddress, 7)}
                      <CopyToClipboard
                        text={launchpadData.creatorAddress}
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
                  {launchpadData.launchpadType == "public" && (
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Tokens for Liquidity{" "}
                      <div>
                        {formatNumber(launchpadData.lp_jettons)}{" "}
                        {launchpadData.tokenInfo.symbol}
                      </div>
                    </div>
                  )}
                  {launchpadData.isAutoListed == false && (
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Preffered Listing Platform{" "}
                      <div>{launchpadData.listingPlatform}</div>
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

                <AutoListAdmin
                  launchpadData={launchpadData}
                  allContribution={allContribution}
                  status={status}
                  handleModal={handleModal}
                />

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
                    Presale Rate{" "}
                    <div>
                      1 {launchpadData.tokenInfo.symbol} ={" "}
                      {launchpadData.token_price} TON
                    </div>
                  </div>

                  <div className="mt-2 pb-2 flex justify-between items-center ">
                    Preffered Listing Rate{" "}
                    <div>
                      1 {launchpadData.tokenInfo.symbol} ={" "}
                      {launchpadData.listing_price} TON
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {contribution?.length > 0 && (
              <div className="mb-4 md:mb-6 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                <div className="font-semibold text-lg">
                  {launchpadData.tokenInfo.name}'s Sale Contributions
                </div>
                {status == "Active" && (
                  <div className="text-red-500 text-xs">
                    {" "}
                    Contributors can claim {launchpadData.tokenInfo.symbol}{" "}
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
  const [listingURL, setListingURL] = useState("");

  const handleURLChange = (event) => {
    setListingURL(event.target.value);
  };

  const handleContinue = () => {
    autolist(listingURL);
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-600 bg-opacity-75 z-50">
      <div className="text-safemoon-alt px-4 md:px-4 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-xl w-[90%] mt-20 z-[1000]">
        <h2 className="text-base md:text-lg font-semibold mb-4">
          Update Listing Information
        </h2>
        <p className="mb-4 tracking-wide text-sm">
          Kindly update the URL with the listing for the token
        </p>
        <div className="mb-4">
          <label
            htmlFor="listingURL"
            className="block text-sm font-medium text-white"
          >
            Listing URL
          </label>
          <input
            id="listingURL"
            type="text"
            value={listingURL}
            onChange={handleURLChange}
            placeholder="Enter listing URL"
            className="mt-1 block w-full py-2 px-3 border border-gray-300 text-safemoon-dark bg-white rounded-2xl focus:outline-none sm:text-sm"
          />
        </div>
        <div className="flex gap-4 flex-wrap">
          <button
            className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium dark:border-0 text-md text-center dark:bg-red-500 dark:hover:bg-red-700 text-white bg-red-500 dark:hover:text-white hover:text-white hover:bg-red-700 dark:text-white"
            onClick={() => closeModal(null)}
          >
            Close
          </button>
          <button
            className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium dark:border-0 text-md text-center dark:bg-white/30 dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/50 dark:text-gray-300"
            onClick={handleContinue}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const ClaimFundsModal = ({ totalContribution, closeModal, claimFunds }) => {
  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-500 bg-opacity-75 z-50">
      <div className="text-safemoon-alt  px-4 md:px-4 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-xl w-[90%] mt-20 z-[1000]">
        <h2 className="text-base md:text-lg font-semibold mb-4">
          Claim Project Funds
        </h2>
        <p className="mb-4 tracking-wide text-sm">
          You will receive 95% of {Number(totalContribution)} TON (Total raise)
          as per the terms of the sale creation while the remaining 5% goes to
          the platform.
          <br /> <br />
          Note that you as the platform manager would be responsible for sending
          leftover tokens and TON to the address of the creator after you have
          listed the token.
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
            onClick={() => claimFunds()}
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutolistDetails;
