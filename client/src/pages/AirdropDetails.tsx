import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  RiArrowLeftLine,
  RiTwitterXLine,
  RiTelegramLine,
  RiGlobalLine,
  RiFacebookLine,
  RiDiscordLine,
  RiRedditLine,
} from "react-icons/ri";
import BN from "bn.js";
import { toast, Flip } from "react-toastify";
import {
  formatNumber,
  checkImageURL,
  makeElipsisAddress,
  parseAirdropEntries,
  parseAirdropEntriesNormal,
  getJettonWalletAddress,
  findAirdropEntryIndex,
  getJettonWalletAddressLock,
  formatDateTime,
} from "../helpers";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaCopy, FaCheckCircle } from "react-icons/fa";
import airdropService from "../api/airdropService";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { Airdrop } from "../contracts/airdrop";
import { Address, beginCell, storeStateInit, Cell } from "ton-core";
import { toNano, fromNano } from "@ton/core";
import airdropHex from "../contracts/airdrop.compiled";
import { normalizeAddress } from "../helpers";
//@ts-ignore
import DefaultImage from "../assets/images/default.png";

const AirdropDetails = () => {
  const { id } = useParams();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [modalType, setModalType] = useState(null);
  const [airdropDetails, setAirdropDetails] = useState(null);
  const [claimDetails, setClaimDetails] = useState(null);
  const [allClaims, setAllClaims] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [contract, setContract] = useState(null);
  const [transfer, setTransfer] = useState(null);
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);
  const [airdropAddress, setAirdropAddress] = useState(null);
  const [airdropWallet, setAirdropWallet] = useState(null);
  const [status, setStatus] = useState("Upcoming");

  const AIRDROP_CODE = Cell.fromBoc(Buffer.from(airdropHex.hex, "hex"))[0];
  const DEPLOY_GAS = 200000000;
  const TRANSFER_GAS = 100000000;

  const handleModal = (type) => {
    setModalType(type === modalType ? null : type);
  };

  const handleCopy1 = () => {
    setCopied1(true);
    setTimeout(() => setCopied1(false), 2000);
  };

  const handleCopy2 = () => {
    setCopied2(true);
    setTimeout(() => setCopied2(false), 2000);
  };

  useEffect(() => {
    getData();
  }, []);

  function checkAllocationList(address: string) {
    if (allocations && address) {
      return allocations.some(
        (allocation) => allocation.address == Address.normalize(address)
      );
    }
    return false;
  }

  function getAllocation(address: string) {
    if (allocations && address) {
      const data = allocations.find(
        (allocation) => allocation.address == Address.normalize(address)
      );
      //@ts-ignore
      return data ? data.amount : null;
    }
  }

  async function getData() {
    if (id) {
      const data = await airdropService.getAirdrop(id);
      setAirdropDetails(data);
      const claims = await airdropService.getClaimsByAirdrop(data._id);
      if (walletAddress) {
        const claim = claims.find(
          (claim) =>
            normalizeAddress(claim.userAddress) ===
            normalizeAddress(walletAddress)
        );
        setClaimDetails(claim);
      }
      setAllClaims(claims);

      const start = data.airdropStart;
      const end = data.airdropEnd;
      if (data.allocations !== null || data.allocations !== "") {
        const { entries, totalAmount } = parseAirdropEntriesNormal(
          data.allocations
        );
        setAllocations(entries);
        setTotalTokens(totalAmount);
      }
      if (end) {
        setStatus("Ended");
      } else if (start) {
        setStatus("Active");
      } else {
        setStatus("Upcoming");
      }
    }
  }

  async function updateAllocationData(allocation) {
    let newFormData = { ...airdropDetails, allocations: allocation };
    const dataUpdate = await airdropService.updateAirdrop(
      newFormData._id,
      newFormData
    );
    setModalType(null);
    setAirdropDetails(null);
    getData();
  }

  async function deployContract() {
    const userWallet = await getJettonWalletAddress(
      airdropDetails.tokenInfo.contract_address,
      walletAddress
    );

    let airdrop = Airdrop.createFromConfig(
      {
        jettonWallet: userWallet,
      },
      AIRDROP_CODE
    );

    const airdropAddress = Address.normalize(airdrop.address);

    const airdropWallet = await getJettonWalletAddressLock(
      airdropDetails.tokenInfo.contract_address,
      Address.normalize(airdropAddress)
    );

    const airdropBody = beginCell()
      .storeUint(0x610ca46c, 32)
      .storeUint(0, 64)
      .storeAddress(Address.parse(airdropWallet))
      .endCell();

    const params = {
      code: airdrop.init.code,
      data: airdrop.init.data,
      deployer: Address.parse(walletAddress),
      value: DEPLOY_GAS,
      message: airdropBody,
    };

    const airdropState = beginCell().store(storeStateInit(params)).endCell();

    if (airdropAddress) {
      const deployer = await processContract(
        airdrop.address.toString({ urlSafe: true, bounceable: true }),
        airdropBody,
        new BN(DEPLOY_GAS.toString()),
        airdropState
      );

      const transferAmount =
        BigInt(totalTokens) * 10n ** BigInt(airdropDetails.tokenInfo.decimals);

      let body = beginCell()
        .storeUint(0xf8a7ea5, 32)
        .storeUint(0, 64)
        .storeCoins(transferAmount)
        .storeAddress(airdrop.address)
        .storeAddress(Address.parse(tonConnectUI.account.address))
        .storeUint(0, 1)
        .storeCoins(toNano(0.02))
        .storeUint(0, 1)
        .storeUint(2, 2)
        .endCell();

      let jettonWallet = await getJettonWalletAddressLock(
        airdropDetails.tokenInfo.contract_address,
        tonConnectUI.account?.address
      );

      const binData = body.toBoc().toString("base64");

      setTransfer({
        payload: binData,
        address: jettonWallet,
      });
      setAirdropAddress(airdropAddress);
      setAirdropWallet(airdropWallet);
    }
  }

  async function updateContractData(
    airdropWallet: Address,
    airdropContract: Address
  ) {
    let newFormData = {
      ...airdropDetails,
      airdropWallet: Address.normalize(airdropWallet),
      airdropAddress: Address.normalize(airdropContract),
      airdropStart: Date.now().toString(),
    };

    const dataUpdate = await airdropService.updateAirdrop(
      newFormData._id,
      newFormData
    );
    setAirdropDetails(dataUpdate);
  }

  async function endAirdrop() {
    let newFormData = {
      ...airdropDetails,
      airdropEnd: Date.now().toString(),
    };

    const dataUpdate = await airdropService.updateAirdrop(
      newFormData._id,
      newFormData
    );
    setModalType(null);
    setAirdropDetails(null);
    getData();
  }

  async function resumeAirdrop() {
    let newFormData = {
      ...airdropDetails,
      airdropStart: Date.now().toString(),
      airdropEnd: null,
    };

    const dataUpdate = await airdropService.updateAirdrop(
      newFormData._id,
      newFormData
    );
    setModalType(null);
    setAirdropDetails(null);
    getData();
  }

  async function processContract(
    address: string,
    cell: Cell,
    amount: BN | bigint,
    init: Cell
  ) {
    const binData = cell && cell.toBoc().toString("base64");
    const initCell = init && init.toBoc().toString("base64");

    setContract({
      address: address,
      amount: amount.toString(),
      payload: binData,
      stateInit: initCell || undefined,
    });
  }

  async function sendTonConnectTx() {
    if (Number(totalTokens) > Number(airdropDetails.tokenInfo.user_balance)) {
      toast.error(`Not enough ${airdropDetails.tokenInfo.symbol} for airdrop`);
      return;
    }
    try {
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: contract.address,
            amount: contract.amount,
            payload: contract.payload,
            stateInit: contract.stateInit,
          },
          {
            address: transfer.address,
            amount: TRANSFER_GAS.toString(),
            payload: transfer.payload,
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      });
      if (result?.boc !== undefined) {
        updateContractData(airdropWallet, airdropAddress);
        setModalType(null);
        setTimeout(() => {
          toast.success("Airdrop Launched");
          setAirdropDetails(null);
          getData();
        }, 8000);
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Error deploying airdrop: ${err.message}`);
      }
    }
  }

  async function claim() {
    const { index, claimAmount } = findAirdropEntryIndex(
      airdropDetails.allocations,
      walletAddress
    );

    let claimBody = beginCell()
      .storeUint(0x8fe6d1c3, 32) // op::process_claim
      .storeUint(0, 64) // query_id
      .storeAddress(Address.parse(airdropDetails.airdropWallet))
      .storeCoins(BigInt(claimAmount)) // amount to claim
      .endCell();

    let claimPayload = claimBody.toBoc().toString("base64");

    try {
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: airdropDetails.airdropAddress,
            amount: toNano("0.1").toString(),
            payload: claimPayload,
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      });
      if (result?.boc !== undefined) {
        const newFormData = {
          userAddress: walletAddress,
          airdropId: airdropDetails._id,
          amount: claimAmount,
        };
        const dataUpdate = await airdropService.createClaim(newFormData);
        setModalType(null);
        setTimeout(() => {
          toast.success("Airdrop claimed");
          setAirdropDetails(null);
          getData();
        }, 6000);
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Error claiming airdrop: ${err.message}`);
      }
    }
  }

  return (
    <>
      <div className="flex flex-col w-full mb-24 justify-center mx-auto rounded-2xl py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white ">
        {/************===== HEADER =====************/}
        <div className="my-4">
          <p className="font-black tracking-wide text-2xl lg:text-3xl mb-1 flex gap-3 items-center">
            <Link to="/safe-drop">
              {" "}
              <RiArrowLeftLine size="25px" />
            </Link>
            Airdrop Details
          </p>
        </div>
        {/************===== BODY =====************/}
        {airdropDetails != null ? (
          <>
            {/************===== AIRDROP INFO + CLAIM INFO =====************/}
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="lg:w-2/3 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                <div className="flex justify-between">
                  <div className="flex flex-col items-start lg:flex-row lg:items-center justify-start gap-4">
                    {checkImageURL(airdropDetails.logo) ? (
                      <>
                        {airdropDetails.logo != "" ? (
                          <img
                            src={airdropDetails.logo}
                            alt={airdropDetails.name}
                            className="h-6 md:h-14 w-6 md:w-14 rounded-full"
                          />
                        ) : (
                          <img
                            src={airdropDetails.tokenInfo.logo}
                            alt={airdropDetails.name}
                            className="h-6 md:h-14 w-6 md:w-14 rounded-full"
                          />
                        )}
                      </>
                    ) : (
                      <img
                        src={DefaultImage}
                        alt={airdropDetails.name}
                        className="h-6 md:h-14 w-6 md:w-14 rounded-full"
                      />
                    )}

                    <div>
                      <div className="text-3xl font-semibold">
                        {airdropDetails.title}
                      </div>
                      <div className="flex gap-1 mt-3">
                        {airdropDetails.twitter !== "" && (
                          <a
                            href={airdropDetails.twitter}
                            target="_blank"
                            className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                          >
                            <RiTwitterXLine />
                          </a>
                        )}
                        {airdropDetails.telegram !== "" && (
                          <a
                            href={airdropDetails.telegram}
                            target="_blank"
                            className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                          >
                            <RiTelegramLine />
                          </a>
                        )}
                        {airdropDetails.facebook !== "" && (
                          <a
                            href={airdropDetails.facebook}
                            target="_blank"
                            className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                          >
                            <RiFacebookLine />
                          </a>
                        )}
                        {airdropDetails.reddit !== "" && (
                          <a
                            href={airdropDetails.reddit}
                            target="_blank"
                            className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                          >
                            <RiRedditLine />
                          </a>
                        )}
                        {airdropDetails.discord !== "" && (
                          <a
                            href={airdropDetails.discord}
                            target="_blank"
                            className="flex cursor-pointer justify-center items-center p-1 bg-safemoon-dark text-white dark:bg-white dark:text-black h-[1.5rem] w-[1.5rem] rounded-2xl"
                          >
                            <RiDiscordLine />
                          </a>
                        )}

                        {airdropDetails.website !== "" && (
                          <a
                            href={airdropDetails.website}
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
                        : status == "Cancelled"
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
                  <div className="my-4 pb-2">{airdropDetails?.description}</div>
                  {airdropDetails.airdropAddress && (
                    <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                      Airdrop Address{" "}
                      <div>
                        {" "}
                        {makeElipsisAddress(airdropDetails.airdropAddress, 7)}
                        <CopyToClipboard
                          text={airdropDetails.airdropAddress}
                          onCopy={handleCopy1}
                        >
                          <button className="ml-2">
                            {copied1 ? <FaCheckCircle /> : <FaCopy />}
                          </button>
                        </CopyToClipboard>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Token Name <div> {airdropDetails.tokenInfo?.name}</div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Token Address{" "}
                    <div>
                      {" "}
                      {makeElipsisAddress(airdropDetails?.tokenAddress, 7)}
                      <CopyToClipboard
                        text={airdropDetails?.tokenAddress}
                        onCopy={handleCopy2}
                      >
                        <button className="ml-2">
                          {copied2 ? <FaCheckCircle /> : <FaCopy />}
                        </button>
                      </CopyToClipboard>
                    </div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Token Symbol <div>{airdropDetails.tokenInfo?.symbol}</div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Token Decimals{" "}
                    <div>{airdropDetails.tokenInfo?.decimals}</div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Total Supply{" "}
                    <div>
                      {formatNumber(airdropDetails.tokenInfo?.total_supply)}{" "}
                      {airdropDetails.tokenInfo?.symbol}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3 mt-4 lg:mt-0 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                <div className="mt-4">
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Total Airdrop Tokens{" "}
                    <div className="text-right">
                      {totalTokens || 0} {airdropDetails.tokenInfo.symbol}
                    </div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Your Allocation{" "}
                    <div>
                      {(walletAddress && getAllocation(walletAddress)) || 0}{" "}
                      {airdropDetails.tokenInfo.symbol}
                    </div>
                  </div>
                  <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                    Your Claimed{" "}
                    <div>
                      {claimDetails !== null && claimDetails?.amount
                        ? fromNano(claimDetails?.amount)
                        : "0"}{" "}
                      {airdropDetails.tokenInfo.symbol}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/************===== ADMIN SECTION + ALLOCATIONS LIST =====************/}
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="lg:w-2/3 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                <div className="font-semibold text-lg">
                  Allocations ({allocations?.length})
                </div>
                <ul>
                  {allocations?.length > 0 &&
                    allocations?.map((allocation, index) => (
                      <li
                        key={index}
                        className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600"
                      >
                        {allocation.address
                          ? makeElipsisAddress(allocation.address, 7)
                          : ""}
                        <div>
                          {" "}
                          {formatNumber(allocation.amount)}{" "}
                          {airdropDetails.tokenInfo.symbol}
                        </div>
                      </li>
                    ))}
                  {airdropDetails.allocations?.length == 0 && (
                    <div className="mt-6 py-4 flex justify-center items-center">
                      No data
                    </div>
                  )}
                </ul>
              </div>
              {airdropDetails.creatorAddress == walletAddress && (
                <div className="lg:w-1/3 mt-4 lg:mt-0 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                  <p className="mb-2 font-semibold text-lg">Admin Settings</p>
                  {airdropDetails.airdropStart == "" ||
                    (airdropDetails.airdropStart == null && (
                      <div className="mt-4">
                        <div className="font-semibold">Allocation Control</div>
                        <button
                          onClick={() => handleModal("allocation")}
                          className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                        >
                          Set/Update Allocations
                        </button>
                        <button
                          onClick={() => handleModal("delete")}
                          className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                        >
                          Remove All Allocations
                        </button>
                      </div>
                    ))}

                  {allocations.length > 0 && !airdropDetails.airdropEnd && (
                    <div className="mt-4">
                      <div className="font-semibold">Airdrop Control</div>
                      {!airdropDetails.airdropStart && (
                        <button
                          onClick={() => handleModal("start")}
                          className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                        >
                          Start Airdrop
                        </button>
                      )}
                      <button
                        onClick={() => handleModal("stop")}
                        className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                      >
                        Stop Airdrop
                      </button>
                    </div>
                  )}

                  {allocations.length > 0 && airdropDetails.airdropEnd && (
                    <button
                      onClick={() => resumeAirdrop()}
                      className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                    >
                      Resume Airdrop
                    </button>
                  )}
                </div>
              )}

              {walletAddress && checkAllocationList(walletAddress) ? (
                <div className="lg:w-1/3 mt-4 lg:mt-0 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                  <p className="mb-2 font-semibold text-lg">Allocation Zone</p>
                  {status == "Active" && claimDetails == null && (
                    <button
                      onClick={() => claim()}
                      className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                    >
                      Claim Airdrop
                    </button>
                  )}
                  {claimDetails !== null && (
                    <p className="italic">You have already claimed!</p>
                  )}
                </div>
              ) : null}
            </div>

            {/************===== CLAIMS LIST =====************/}
            {allClaims.length > 0 &&
              walletAddress == airdropDetails.creatorAddress && (
                <div className="lg:w-2/3 p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
                  <div className="font-semibold text-lg">
                    Claims ({allClaims?.length})
                  </div>
                  <ul>
                    {allClaims?.length > 0 &&
                      allClaims?.map((claim, index) => (
                        <li
                          key={index}
                          className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600"
                        >
                          <div className="lg:pr-10">
                            {claim.userAddress
                              ? makeElipsisAddress(claim.userAddress, 7)
                              : ""}
                          </div>

                          <div>
                            {" "}
                            {formatNumber(fromNano(claim.amount))}{" "}
                            {airdropDetails.tokenInfo.symbol}
                          </div>
                          <div>
                            {" "}
                            {claim.claimDate && formatDateTime(claim.claimDate)}
                          </div>
                        </li>
                      ))}
                  </ul>
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
                ].map((index) => (
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
                ].map((index) => (
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
      {/************===== MODALS =====************/}
      {modalType === "allocation" && (
        <SetAllocationModal
          allocationData={airdropDetails?.allocations || ""}
          closeModal={handleModal}
          updateAllocationData={updateAllocationData}
        />
      )}
      {modalType === "delete" && (
        <SetDeleteModal
          closeModal={handleModal}
          updateAllocationData={updateAllocationData}
        />
      )}
      {modalType === "stop" && (
        <StopAirdropModal closeModal={handleModal} endAirdrop={endAirdrop} />
      )}
      {modalType === "start" && (
        <StartAirdropModal
          closeModal={handleModal}
          contract={contract}
          setContract={setContract}
          deployContract={deployContract}
          sendTonConnectTx={sendTonConnectTx}
        />
      )}
    </>
  );
};

const SetAllocationModal = ({
  allocationData,
  closeModal,
  updateAllocationData,
}) => {
  const [allocations, setAllocations] = useState(allocationData);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAllocations(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = parseAirdropEntries(allocations);
      if (data) {
        await updateAllocationData(allocations);
      }
      toast.success("Allocations added successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
      closeModal(null);
    } catch (error) {
      toast.error("Error saving allocations");
    }
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-600 bg-opacity-75 z-50">
      <div className="text-safemoon-alt  px-4 md:px-4 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-xl w-[90%] mt-20 z-[1000]">
        <h2 className="text-base md:text-lg font-semibold mb-4">
          Set Allocations
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <textarea
              className="shadow appearance-none border rounded-2xl text-sm w-full resize-none py-3 px-3 text-gray-700 leading-tight focus:outline-none"
              value={allocations}
              rows={10}
              id="allocations"
              name="allocations"
              required
              placeholder={`address: amount\naddress: amount\naddress: amount`}
              onChange={handleInputChange}
            ></textarea>
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
              type="submit"
            >
              Add Allocations
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SetDeleteModal = ({ closeModal, updateAllocationData }) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateAllocationData("");

      toast.success("All allocations removed", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
      closeModal(null);
    } catch (error) {
      toast.error("Error removing allocations");
    }
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-600 bg-opacity-75 z-50">
      <div className="text-safemoon-alt  px-4 md:px-4 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-xl w-[90%] mt-20 z-[1000]">
        <h2 className="text-base md:text-lg font-semibold mb-4">
          Delete Allocations
        </h2>
        <p className="mb-4 tracking-wide text-sm">
          Are you sure you want to delete all allocations for this airdrop?
        </p>
        <div className="flex gap-4 flex-wrap">
          <button
            className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-red-500 dark:hover:bg-red-700 text-white bg-red-500 dark:hover:text-white hover:text-white hover:bg-red-700 dark:text-white"
            onClick={() => closeModal(null)}
          >
            Close
          </button>
          <button
            className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-white/30 dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/50 dark:text-gray-300"
            onClick={handleSubmit}
          >
            Delete all Allocations
          </button>
        </div>
      </div>
    </div>
  );
};

const StopAirdropModal = ({ closeModal, endAirdrop }) => {
  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-500 bg-opacity-75 z-50">
      <div className="text-safemoon-alt  px-4 md:px-4 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-md w-[90%] mt-20 z-[1000]">
        <h2 className="text-base md:text-lg font-semibold mb-4">
          Stop Airdrop
        </h2>
        <p className="mb-4 tracking-wide text-sm">
          Are you sure you want to stop this airdrop?
        </p>
        <div className="flex gap-4 ">
          <button
            className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-red-500 dark:hover:bg-red-700 text-white bg-red-500 dark:hover:text-white hover:text-white hover:bg-red-700 dark:text-white"
            onClick={() => closeModal(null)}
          >
            Close
          </button>
          <button
            className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-white/30 dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/50 dark:text-gray-300"
            onClick={() => endAirdrop()}
          >
            Stop Airdrop
          </button>
        </div>
      </div>
    </div>
  );
};

const StartAirdropModal = ({
  closeModal,
  deployContract,
  contract,
  setContract,
  sendTonConnectTx,
}) => {
  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-500 bg-opacity-75 z-50">
      <div className="text-safemoon-alt  px-4 md:px-4 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-md w-[90%] mt-20 z-[1000]">
        <h2 className="text-base md:text-lg font-semibold mb-4">
          Start Airdrop
        </h2>

        {contract == null ? (
          <>
            {" "}
            <p className="mb-4 tracking-wide text-sm">
              Are you sure you want to start this airdrop?
            </p>
            <div className="flex gap-4 flex-wrap">
              <button
                className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-red-500 dark:hover:bg-red-700 text-white bg-red-500 dark:hover:text-white hover:text-white hover:bg-red-700 dark:text-white"
                onClick={() => closeModal(null)}
              >
                Close
              </button>
              <button
                className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-white/30 dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/50 dark:text-gray-300"
                onClick={() => deployContract()}
              >
                Start Airdrop
              </button>
            </div>
          </>
        ) : (
          <>
            {" "}
            <p className="mb-4 tracking-wide text-sm">
              You will not be able to change your allocations after clicking
              'yes', are you sure you want to proceed?
            </p>
            <div className="flex gap-4 flex-wrap">
              <button
                className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-red-500 dark:hover:bg-red-700 text-white bg-red-500 dark:hover:text-white hover:text-white hover:bg-red-700 dark:text-white"
                onClick={() => setContract(null)}
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
          </>
        )}
      </div>
    </div>
  );
};

export default AirdropDetails;
