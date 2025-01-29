import { useEffect, useState } from "react";
import { RiArrowLeftLine } from "react-icons/ri";
import { Link, useParams } from "react-router-dom";
import {
  formatDateTime,
  formatDateTimeUTC,
  formatDateTimeFromTimestamp,
  formatNumber,
  getJettonWalletAddress,
  getJettonWalletAddressLock,
  isTimeGreaterThanCurrent,
  isTimeGreaterThanCurrentNormal,
  makeElipsisAddress,
} from "../helpers";
import { toast, Flip } from "react-toastify";
import lockService from "../api/lockService";
import CopyToClipboard from "react-copy-to-clipboard";
import { FaCheckCircle, FaCopy } from "react-icons/fa";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { Address, beginCell, toNano } from "ton-core";

const TokenLockDetails = () => {
  const [lock, setLock] = useState(null);
  const { lockAddress } = useParams();
  const [copied, setCopied] = useState(false);
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const TRANSFER_GAS = 200000000;

  useEffect(() => {
    getData();
  }, []);

  //console.log(lock?.tgeDate && isTimeGreaterThanCurrentNormal(lock?.tgeDate));

  //console.log("TEST", isTimeGreaterThanCurrentNormal("2024-08-06T17:00:00.000Z"));

  async function getData() {
    const data = await lockService.getLock(lockAddress);
    console.log("DATA", data);
    setLock(data);
  }

  async function claimTokens() {
    const lockAddress = Address.normalize(lock.lockAddress);
    const lockupWalletAddress = await getJettonWalletAddressLock(
      lock.tokenAddress,
      lockAddress
    );
    const claimAmount =
      BigInt(lock.amount) * 10n ** BigInt(lock.tokenInfo.decimals);
    const claimBody = beginCell()
      .storeUint(0x3f32601d, 32)
      .storeUint(0, 64)
      .storeUint(0, 8)
      .storeRef(
        beginCell()
          .storeUint(0x18, 6)
          .storeAddress(Address.parse(lockupWalletAddress))
          .storeCoins(toNano("0.05"))
          .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1)
          .storeMaybeRef(
            beginCell()
              .storeUint(0xf8a7ea5, 32)
              .storeUint(0, 64)
              .storeCoins(claimAmount)
              .storeAddress(Address.parse(lock.ownerAddress))
              .storeAddress(Address.parse(lock.ownerAddress))
              .storeUint(0, 1)
              .storeCoins(1)
              .storeUint(0, 1)
              .endCell()
          )
          .endCell()
      )
      .endCell();

    const binData = claimBody.toBoc().toString("base64");

    try {
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: Address.normalize(lockAddress),
            amount: TRANSFER_GAS.toString(),
            payload: binData,
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 300,
      });
      if (result?.boc !== undefined) {
        const dataUpdate = await lockService.updateLock(lock._id, {
          claimed: true,
        });
        setTimeout(() => {
          toast.success("Tokens claimed!");
          setLock(null);
          getData();
        }, 6000);
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Error claiming tokens: ${err.message}`);
      }
    }
  }

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex flex-col w-full mb-24 justify-center mx-auto rounded-2xl py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white ">
        {/************===== HEADER =====************/}
        <div className="my-4">
          <p className="font-black tracking-wide text-2xl lg:text-3xl mb-1 flex gap-3 items-center">
            <Link to="/safe-lock">
              {" "}
              <RiArrowLeftLine size="25px" />
            </Link>
            Lock Info
          </p>
        </div>
        {lock != null ? (
          <div className="flex flex-col gap-4 mb-4">
            <div className="w-full p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
              <div className="flex justify-between">
                <div className="flex flex-col items-start lg:flex-row lg:items-center justify-start gap-4">
                  <img
                    src={lock.tokenInfo.logo}
                    alt={lock.title}
                    className="h-6 md:h-14 w-6 md:w-14 rounded-full"
                  />
                  <div>
                    <div className="text-3xl font-semibold">{lock.title}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  Token Name <div> {lock.tokenInfo?.name}</div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  Token Address{" "}
                  <div>
                    {" "}
                    {makeElipsisAddress(lock?.tokenAddress, 7)}
                    <CopyToClipboard
                      text={lock?.tokenAddress}
                      onCopy={handleCopy}
                    >
                      <button className="ml-2">
                        {copied ? <FaCheckCircle /> : <FaCopy />}
                      </button>
                    </CopyToClipboard>
                  </div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  Token Symbol <div>{lock.tokenInfo?.symbol}</div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  Token Decimals <div>{lock.tokenInfo?.decimals}</div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  Total Supply{" "}
                  <div>
                    {formatNumber(lock.tokenInfo?.total_supply)}{" "}
                    {lock.tokenInfo?.symbol}
                  </div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  Current Locked Amount{" "}
                  <div>
                    {formatNumber(lock.amount)} {lock.tokenInfo?.symbol}
                  </div>
                </div>
                <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                  Lock Until <div>{formatDateTime(lock.tgeDate)} (UTC)</div>
                </div>
              </div>
            </div>
            {walletAddress == lock.ownerAddress && !lock.claimed && (
              <>
                {isTimeGreaterThanCurrent(lock.tgeDate) ? (
                  <div className="my-4 text-right">You can't unlock yet!</div>
                ) : (
                  <div className="my-4 text-right">
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
                      <button
                        onClick={() => claimTokens()}
                        className="py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
                      >
                        Unlock
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {walletAddress == lock.ownerAddress && lock.claimed == true && (
              <div className="my-4 text-right">Tokens Unlocked!</div>
            )}
          </div>
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
    </>
  );
};

export default TokenLockDetails;
