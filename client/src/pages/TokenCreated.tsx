import CopyToClipboard from "react-copy-to-clipboard";
import { formatNumber, makeElipsisAddress } from "../helpers";
import { FaCheckCircle, FaCopy } from "react-icons/fa";
import { useState } from "react";

const TokenCreated = ({ tokenData, address }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full mb-24 justify-center mx-auto rounded-2xl py-1 text-safemoon-alt   px-4 md:px-8  dark:text-white text-white">
      <div className="text-center mt-10 mb-10 text-white">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-white"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Token Created successfully</h2>
        <div className="flex justify-center">
          <div className="w-full md:w-[70%] p-4 xl:p-6 dark:border-gray-600 rounded-2xl shadow-sm text-safemoon-dark font-semibold bg-white border dark:text-white dark:bg-[#282828]">
            <div className="flex justify-between">
              <span>Name</span>
              <span>{tokenData.name}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Address</span>
              <span>
                {" "}
                {makeElipsisAddress(address, 7)}
                <CopyToClipboard text={address} onCopy={handleCopy}>
                  <button className="ml-2">
                    {copied ? <FaCheckCircle /> : <FaCopy />}
                  </button>
                </CopyToClipboard>
              </span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Symbol</span>
              <span>{tokenData.symbol}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Total Supply</span>
              <span>
                {" "}
                {formatNumber(tokenData.amount)} {tokenData.symbol}
              </span>
            </div>
          </div>
        </div>

        <button
          className="mt-4 py-2 px-8 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
          onClick={() => window.location.reload()}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default TokenCreated;
