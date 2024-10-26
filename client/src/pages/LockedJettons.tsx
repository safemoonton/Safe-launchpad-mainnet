import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RiRocket2Fill, RiSearch2Line } from "react-icons/ri";
import lockService from "../api/lockService";
import { useTonAddress } from "@tonconnect/ui-react";
import { formatDateTime, formatNumber } from "../helpers";

const LockedJettons = () => {
  const walletAddress = useTonAddress();
  const [showAllLocks, setShowAllLocks] = useState(true);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [tokens, setTokens] = useState(null);
  const [filteredTokens, setFilteredTokens] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const tokensPerPage = 10;

  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    const data = await lockService.getAllLocks();
    const newData = data.reverse();
    setTokens(newData);
    setFilteredTokens(newData);
    setIsLoading(false);
  }

  const handleSwitcherChange = (data) => {
    if (data === "all") {
      setFilteredTokens(tokens);
      setShowAllLocks(true);
    } else {
      const filtered = tokens.filter(
        (token) =>
          token.creatorAddress == walletAddress ||
          token.ownerAddress == walletAddress
      );
      setFilteredTokens(filtered);
      setShowAllLocks(false);
    }
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const filtered = tokens.filter(
      (token) =>
        token.tokenInfo.name.toLowerCase().includes(query.toLowerCase()) ||
        token.title.toLowerCase().includes(query.toLowerCase()) ||
        token.tokenInfo.symbol.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTokens(filtered);
    setCurrentPage(1); // Reset to first page
  };

  const indexOfLastToken = currentPage * tokensPerPage;
  const indexOfFirstToken = indexOfLastToken - tokensPerPage;
  const currentTokens = filteredTokens?.slice(
    indexOfFirstToken,
    indexOfLastToken
  );
  const totalPages = Math.ceil(filteredTokens?.length / tokensPerPage);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="flex flex-col w-full mb-24 justify-center mx-auto rounded-2xl py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white">
      {/* Header */}
      <div className="my-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-2">
          <div className="">
            {" "}
            <p className="font-black tracking-wide text-2xl lg:text-3xl mb-1">
              SAFE Lock
            </p>
            <p className="mb-3 max-w-[30rem] text-sm font-light hidden lg:block text-gray-400 dark:text-gray-400">
              Lock your tokens securely on SAFE Lock
            </p>
          </div>
          <button
            onClick={() => navigate("/safe-lock/create")}
            className="py-2 w-full lg:w-max sm:py-2 px-5 sm:px-6 lg:max-h-10 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
          >
            Lock token
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="w-full flex flex-col justify-center">
        <div className="flex flex-col md:flex-row justify-between items-start gap-2 md:gap-0 md:items-center mb-4">
          <nav className="flex space-x-2 mb-4" aria-label="Tabs" role="tablist">
            <button
              onClick={() => handleSwitcherChange("all")}
              className={`${
                showAllLocks
                  ? "text-safemoon-dark bg-white font-semibold  text-safemoon-dark dark:bg-white/10 dark:text-white "
                  : "text-neutral-400 bg-transparent dark:bg-transparent dark:text-neutral-400 hover:bg-white/5 dark:hover:bg-white/5"
              } rounded-2xl py-2.5 px-5 inline-flex items-center gap-x-2  focus:outline-none `}
            >
              All{" "}
              <span className="ms-1 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-300">
                {tokens?.length}
              </span>
            </button>
            <button
              onClick={() => handleSwitcherChange("user")}
              className={`${
                !showAllLocks
                  ? "text-safemoon-dark bg-white  text-safemoon-dark font-semibold dark:bg-white/10 dark:text-white "
                  : "text-neutral-400 bg-transparent dark:bg-transparent dark:text-neutral-400 hover:bg-white/5 dark:hover:bg-white/5"
              } rounded-2xl py-2.5 px-5  inline-flex items-center gap-x-2 focus:outline-none`}
            >
              My Locks{" "}
              <span className="ms-1 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-300">
                {
                  tokens?.filter(
                    (token) =>
                      token.creatorAddress == walletAddress ||
                      token.ownerAddress == walletAddress
                  ).length
                }
              </span>
            </button>
          </nav>

          <div className="relative w-full md:w-max">
            <input
              type="text"
              placeholder="Search..."
              className="py-2 sm:py-2 px-3 sm:px-4 rounded-2xl text-gray-400 text-md font-medium w-full pl-8 sm:pl-12 outline-none dark:text-white dark:bg-white/10 "
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <span className="absolute left-2 sm:left-5 text-lg top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white">
              <RiSearch2Line />
            </span>
          </div>
        </div>
        <div className="mb-4">
          {/* Table for large devices */}
          <div className="hidden lg:block w-full overflow-auto border border-white dark:border-gray-600 rounded-2xl border-separate">
            <table className="w-full text-left">
              <thead>
                <tr className="text-white bg-gray-700 dark:text-gray-300">
                  <th className="px-4 py-2 hidden sm:table-cell"></th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Symbol</th>
                  <th className="px-4 py-2">Unlock Date</th>
                  <th className="px-4 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {currentTokens?.map((token, index) => (
                  <tr
                    key={index}
                    className={`border-t ${
                      index === 0
                        ? "border-none"
                        : "border-white dark:border-gray-600"
                    }`}
                  >
                    <td className="px-4 py-2 hidden sm:table-cell">
                      <img
                        src={token.tokenInfo.logo}
                        alt={token.tokenInfo.symbol}
                        className="h-6 md:h-10 w-6 md:w-10 mr-2 rounded-full bg-white"
                      />
                    </td>
                    <td className="px-4 pr-32 py-2">{token.title}</td>
                    <td className="px-4 py-2">{formatNumber(token.amount)}</td>
                    <td className="px-4 py-2">{token.tokenInfo.symbol}</td>
                    <td className="px-4 py-2">
                      {formatDateTime(token.tgeDate)} (UTC)
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        to={`/safe-lock/${token.lockAddress}`}
                        className="py-2 cursor-pointer font-semibold text-center px-4 xl:px-8 rounded-2xl text-xs xl:text-sm dark:bg-white dark:hover:bg-white/10 hover:text-safemoon-dark hover:bg-black/20 dark:hover:text-white text-white bg-safemoon-dark dark:text-black hover:shadow-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card layout for small and medium devices */}
          <div className="lg:hidden space-y-4">
            {currentTokens?.map((token, index) => (
              <div
                key={index}
                className="border border-white dark:border-gray-600 rounded-2xl p-4 flex flex-col"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={token.tokenInfo.logo}
                    alt={token.tokenInfo.symbol}
                    className="h-6 w-6 mr-2 rounded-full bg-white"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold">{token.title}</span>
                    <span className="text-gray-400 dark:text-gray-400 text-sm">
                      {token.tokenInfo.symbol}
                    </span>
                  </div>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Amount:</span>{" "}
                  {formatNumber(token.amount)}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Unlock Date (UTC):</span>{" "}
                  {formatDateTime(token.tgeDate)}
                </div>
                <Link
                  to={`/safe-lock/${token.lockAddress}`}
                  className="py-2 cursor-pointer font-semibold text-center px-4 rounded-2xl text-xs dark:bg-white dark:hover:bg-white/10 hover:text-safemoon-dark hover:bg-black/20 dark:hover:text-white text-white bg-safemoon-dark dark:text-black hover:shadow-sm"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>

        {filteredTokens?.length > 0 && (
          <div className="mb-4 flex justify-center items-center space-x-2">
            <button
              className={`py-2 px-4 rounded-2xl ${
                currentPage === 1 ? "cursor-not-allowed" : ""
              }`}
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`py-2 px-4 rounded-2xl ${
                  page === currentPage
                    ? "bg-safemoon-dark text-white dark:text-black dark:bg-white"
                    : ""
                }`}
                onClick={() => handlePageClick(page)}
              >
                {page}
              </button>
            ))}
            <button
              className={`py-2 px-4 rounded-2xl ${
                currentPage === totalPages ? "cursor-not-allowed" : ""
              }`}
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
        <div className="mb-10 text-center">
          {filteredTokens?.length === 0 && (
            <div className="flex justify-center items-center min-h-72 w-full">
              <div className="flex justify-center gap-2 flex-col items-center mb-8">
                <RiRocket2Fill size="50px" />
                No tokens locked
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LockedJettons;
