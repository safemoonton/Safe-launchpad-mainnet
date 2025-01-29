import { useEffect, useState } from "react";
import { RiSearch2Line, RiRocket2Fill } from "react-icons/ri";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import airdropService from "../api/airdropService";
import { Link, useNavigate } from "react-router-dom";
import {
  parseAirdropEntriesNormal,
  checkImageURL,
  normalizeAddress,
} from "../helpers";
//@ts-ignore
import DefaultImage from "../assets/images/default.png";

const AirdropList = () => {
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [filter, setFilter] = useState("All");
  const [airdrops, setAirdrops] = useState(null);
  const [filteredAirdrops, setFilteredAirdrops] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const airdropsPerPage = 6;
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    const data = await airdropService.getAllAirdrops();
    const formattedData = data.reverse().map((airdrop) => {
      const start = airdrop.airdropStart;
      const end = airdrop.airdropEnd;
      const allocations = airdrop.allocations;
      let totalToken = 0;
      let participants = 0;
      let status = "Upcoming";
      if (end) {
        status = "Ended";
      } else if (start) {
        status = "Active";
      } else {
        status = "Upcoming";
      }
      if (
        allocations !== null ||
        allocations !== "" ||
        allocations !== undefined ||
        !!allocations
      ) {
        let { entries, totalAmount } = parseAirdropEntriesNormal(allocations);
        totalToken = totalAmount;
        participants = entries.length;
      }
      return {
        ...airdrop,
        status: status,
        totalToken: totalToken,
        participants: participants,
      };
    });
    setAirdrops(formattedData);
    setFilteredAirdrops(formattedData); // Ensure filteredAirdrops is set initially
    setIsLoading(false);
  }

  useEffect(() => {
    if (filter === "All") {
      setFilteredAirdrops(airdrops);
    } else {
      const newFilteredAirdrops = airdrops?.filter((airdrop) => {
        return (
          normalizeAddress(airdrop.creatorAddress) ===
          normalizeAddress(walletAddress)
        );
      });
      setFilteredAirdrops(newFilteredAirdrops);
    }
    setSearchQuery("");
    setCurrentPage(1);
  }, [filter, airdrops, walletAddress]);

  const myAirdrops = airdrops?.filter((airdrop) => {
    return airdrop.creatorAddress === walletAddress;
  });

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const filtered = airdrops.filter((airdrop) =>
      airdrop.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredAirdrops(filtered);
    setCurrentPage(1);
  };

  // Pagination calculations
  const indexOfLastToken = currentPage * airdropsPerPage;
  const indexOfFirstToken = indexOfLastToken - airdropsPerPage;
  const currentAirdrops =
    filteredAirdrops?.slice(indexOfFirstToken, indexOfLastToken) || [];
  const totalPages = Math.ceil(filteredAirdrops?.length / airdropsPerPage);

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
    <div className="flex flex-col w-full mb-24  justify-center mx-auto rounded-2xl py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white ">
      {/* Header */}
      <div className="my-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-2">
          <div className="">
            <p className="font-black tracking-wide text-2xl lg:text-3xl mb-1">
              SAFE Drop
            </p>
            <p className="mb-3 max-w-[30rem] text-sm font-light hidden lg:block text-gray-400 dark:text-gray-400">
              Airdrop your tokens to the community
            </p>
          </div>
          <button
            onClick={() => navigate("/safe-drop/create")}
            className="py-2 w-full lg:w-max sm:py-2 px-5 sm:px-6 lg:max-h-10 rounded-2xl text-sm font-semibold dark:bg-white dark:text-black dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
          >
            Create Drop
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="w-full flex flex-col justify-center">
        {/* Launchpad switch */}
        <nav className="flex space-x-2 mb-4" aria-label="Tabs" role="tablist">
          <button
            onClick={() => setFilter("All")}
            className={`${
              filter === "All"
                ? "text-safemoon-dark bg-white font-semibold  text-safemoon-dark dark:bg-white/10 dark:text-white "
                : "text-neutral-400 bg-transparent dark:bg-transparent dark:text-neutral-400 hover:bg-white/5 dark:hover:bg-white/5"
            } rounded-2xl py-2.5 px-5 inline-flex items-center gap-x-2  focus:outline-none `}
          >
            All{" "}
            <span className="ms-1 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-300">
              {airdrops?.length}
            </span>
          </button>
          <button
            onClick={() => setFilter("My")}
            className={`${
              filter === "My"
                ? "text-safemoon-dark bg-white  text-safemoon-dark font-semibold dark:bg-white/10 dark:text-white "
                : "text-neutral-400 bg-transparent dark:bg-transparent dark:text-neutral-400 hover:bg-white/5 dark:hover:bg-white/5"
            } rounded-2xl py-2.5 px-5  inline-flex items-center gap-x-2 focus:outline-none`}
          >
            My Drops{" "}
            <span className="ms-1 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-300">
              {myAirdrops?.length}
            </span>
          </button>
        </nav>

        {/* Search + Filter */}
        <div className="flex flex-col lg:flex-row gap-4 items-center mb-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search jetton name"
              className="py-2 sm:py-2 px-3 sm:px-4 rounded-2xl text-gray-400 text-md font-medium w-full pl-8 sm:pl-12 outline-none dark:text-white dark:bg-white/10 "
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <span className="absolute left-2 sm:left-5 text-lg top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white">
              <RiSearch2Line />
            </span>
          </div>
        </div>

        {!isLoading ? (
          <>
            {currentAirdrops.length === 0 ? (
              <div className="flex justify-center items-center min-h-72 w-full">
                <div className="flex justify-center gap-2 flex-col items-center mb-8">
                  <RiRocket2Fill size="50px" />
                  No drops launched
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                  {currentAirdrops.map((airdrop, index) => (
                    <div
                      key={index}
                      className="flex flex-col dark:border-gray-600 rounded-2xl shadow-sm text-safemoon-dark font-medium bg-white border dark:text-white dark:bg-[#282828] p-8"
                    >
                      <div className="flex justify-between items-center">
                        {checkImageURL(airdrop.logo) ? (
                          <>
                            {" "}
                            {airdrop.logo ? (
                              <img
                                src={airdrop.logo}
                                className="h-6 md:h-10 w-6 md:w-10 mr-2 rounded-full"
                              />
                            ) : (
                              <img
                                src={airdrop.tokenInfo.logo}
                                className="h-6 md:h-10 w-6 md:w-10 mr-2 rounded-full"
                              />
                            )}
                          </>
                        ) : (
                          <img
                            src={DefaultImage}
                            className="h-6 md:h-10 w-6 md:w-10 mr-2 rounded-full"
                          />
                        )}

                        <div
                          className={`py-1 px-4  text-[0.6rem] rounded-full font-semibold ${
                            airdrop.status === "Active"
                              ? "border-green-600 text-green-600 bg-green-100"
                              : airdrop.status === "Ended"
                              ? "border-red-600 text-red-600 bg-red-100"
                              : airdrop.status === "Upcoming"
                              ? "border-yellow-900 text-yellow-900 bg-yellow-100"
                              : "border-gray-600 text-gray-600 bg-gray-100"
                          } `}
                        >
                          {airdrop.status}
                        </div>
                      </div>

                      <div className="mt-2 mb-2 font-bold text-xl">
                        {airdrop.title.slice(0, 24)}
                        {airdrop.title.length > 24 && "..."}
                      </div>
                      <div>
                        <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                          Token{" "}
                          <div>
                            {airdrop.tokenInfo.name} ({airdrop.tokenInfo.symbol}
                            )
                          </div>
                        </div>
                        <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                          Total Token:{" "}
                          <div>
                            {airdrop.totalToken} {airdrop.tokenInfo.symbol}
                          </div>
                        </div>
                        <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                          Allocations: <div>{airdrop.participants}</div>
                        </div>
                      </div>
                      <div className="flex justify-between gap-4 mt-8 items-center">
                        <Link
                          to={`/safe-drop/${airdrop._id}`}
                          className="basis-1/2 py-2 cursor-pointer font-semibold text-center px-4 xl:px-8 rounded-2xl text-xs xl:text-sm dark:bg-white dark:hover:bg-white/10 hover:text-safemoon-dark hover:bg-black/20 dark:hover:text-white text-white bg-safemoon-dark dark:text-black hover:shadow-sm"
                        >
                          View
                        </Link>
                        {airdrop.status && (
                          <div className="mt-2 basis-1/2 text-right">
                            {airdrop.status}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {filteredAirdrops?.length > 0 && (
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
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
                      )
                    )}
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
              </>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col dark:border-gray-600 rounded-2xl shadow-sm text-safemoon-dark font-medium bg-white border dark:text-white dark:bg-[#282828] p-4 animate-pulse"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>

                <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-600 rounded-2xl mb-4"></div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
                    <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
                    <div className="h-6 w-10 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
                  </div>
                  <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
                    <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
                    <div className="h-6 w-10 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
                  </div>
                  <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
                    <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
                    <div className="h-6 w-10 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
                  </div>
                </div>

                <div className="flex justify-between gap-4 mt-8 items-center">
                  <div className="basis-1/2 py-2 px-2 bg-gray-300 dark:bg-gray-600 rounded-2xl h-10"></div>
                  <div className="basis-1/2 h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AirdropList;
