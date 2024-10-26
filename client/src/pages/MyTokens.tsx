import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { RiRocket2Fill, RiSearch2Line } from "react-icons/ri";
import axios from "axios";
import config from "../config";
import { Address, fromNano } from "ton-core";
import { useTonAddress } from "@tonconnect/ui-react";
import { makeElipsisAddress } from "../helpers";
//@ts-ignore
import DefaultImage from "../assets/images/default.png";

const MyTokens = () => {
  const [tokens, setTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const tokensPerPage = 6;
  const walletAddress = useTonAddress();
  const API_URL = config.API_URL;

  useEffect(() => {
    getData();
  }, [walletAddress]);

  async function getData() {
    try {
      const response = await axios.get(
        `${API_URL}${Address.normalize(walletAddress)}/jettons`
      );
      setIsLoading(false);
      setTokens(response?.data?.balances);
      setFilteredTokens(response?.data?.balances);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
    }
  }

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const filtered = tokens.filter(
      (token) =>
        token?.jetton.name.toLowerCase().includes(query.toLowerCase()) ||
        token?.jetton.symbol.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTokens(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredTokens.length / tokensPerPage);
  const currentTokens = filteredTokens.slice(
    (currentPage - 1) * tokensPerPage,
    currentPage * tokensPerPage
  );

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const formatNumber = (num) => {
    return parseInt(num).toLocaleString();
  };

  return (
    <div className="overflow-hidden flex flex-col w-full mb-24 justify-center mx-auto rounded-2xl py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white">
      <div className="my-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-2">
          <div className="">
            {" "}
            <p className="font-black tracking-wide text-2xl lg:text-3xl mb-1">
              My Tokens
            </p>
            <p className="mb-3 max-w-[30rem] text-sm font-light hidden lg:block text-gray-400 dark:text-gray-400">
              All your Jettons, in one place
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center mb-4">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search token name or symbol"
            className="py-2 sm:py-2 px-3 sm:px-4 rounded-2xl text-gray-400 text-md font-medium w-full pl-8 sm:pl-12 outline-none dark:text-white dark:bg-white/10 "
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <span className="absolute left-2 sm:left-5 text-lg top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white">
            <RiSearch2Line />
          </span>
        </div>
      </div>
      <div className="w-full p-4">
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col dark:border-gray-600 rounded-2xl shadow-sm text-safemoon-dark font-medium bg-white border dark:text-white dark:bg-[#282828] p-6 lg:p-8 animate-pulse"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                  <div className="h-4 w-28 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                  <div className="h-10 w-full bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {currentTokens.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                  {currentTokens.map((token) => (
                    <Link
                      to={`/token/${token.jetton.address}`}
                      key={token.jetton.address}
                      className="flex flex-col dark:border-gray-600 rounded-2xl shadow-sm text-safemoon-dark font-medium bg-white border dark:text-white dark:bg-[#282828] p-8"
                    >
                      <div className="flex justify-between items-center">
                        <>
                          {" "}
                          {token.jetton.image ? (
                            <img
                              src={token.jetton.image}
                              className="h-6 bg-white md:h-10 w-6 md:w-10 mr-2 rounded-full"
                            />
                          ) : (
                            <img
                              src={DefaultImage}
                              className="h-6 md:h-10 w-6 md:w-10 mr-2 rounded-full"
                            />
                          )}
                        </>
                      </div>

                      <div className="mt-2 mb-2 font-bold text-xl">
                        {token.jetton.name.slice(0, 24)}
                        {token.jetton.name.length > 24 && "..."}
                      </div>
                      <div>
                        <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                          Token{" "}
                          <div>
                            {token.jetton.name} ({token.jetton.symbol})
                          </div>
                        </div>
                        <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                          My Balance:{" "}
                          <div>
                            {formatNumber(fromNano(token.balance))}{" "}
                            {token.jetton.symbol}
                          </div>
                        </div>
                        <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                          Allocations:{" "}
                          <div>
                            {" "}
                            {makeElipsisAddress(
                              Address.normalize(token.jetton.address),
                              8
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between gap-4 mt-8 items-center">
                        <div className="basis-1/2 py-2 cursor-pointer font-semibold text-center px-4 xl:px-8 rounded-2xl text-xs xl:text-sm dark:bg-white dark:hover:bg-white/10 hover:text-safemoon-dark hover:bg-black/20 dark:hover:text-white text-white bg-safemoon-dark dark:text-black hover:shadow-sm">
                          View Token
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex my-20 flex-col items-center justify-center">
                  <RiRocket2Fill size="50px" className="text-safemoon" />
                  <p className="text-lg font-semibold mt-4">
                    You don't have any tokens yet
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {filteredTokens.length !== 0 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handlePreviousPage}
              className={`${
                currentPage === 1
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "bg-safemoon text-white cursor-pointer"
              } py-2 px-4 rounded-l-full transition-colors duration-300 hover:bg-safemoon-alt`}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageClick(index + 1)}
                className={`${
                  currentPage === index + 1
                    ? "bg-safemoon-alt text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                } py-2 px-4 transition-colors duration-300 hover:bg-safemoon-alt`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={handleNextPage}
              className={`${
                currentPage === totalPages
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "bg-safemoon text-white cursor-pointer"
              } py-2 px-4 rounded-r-full transition-colors duration-300 hover:bg-safemoon-alt`}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTokens;
