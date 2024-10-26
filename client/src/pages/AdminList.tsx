import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  RiSearch2Line,
  RiArrowDropDownLine,
  RiArrowDropUpLine,
} from "react-icons/ri";
import { RiRocket2Fill } from "react-icons/ri";
import { useTonAddress } from "@tonconnect/ui-react";
import icoService from "../api/icoService";

const AdminList = () => {
  const walletAddress = useTonAddress();
  const [launchpadData, setLaunchpadData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [isOpen1, setIsOpen1] = useState(false);
  const [statusFilter, setStatusFilter] = useState("No filter");

  const [filteredLaunchpad, setFilteredLaunchpad] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const salesPerPage = 6;
  const [searchQuery, setSearchQuery] = useState("");

  const toggleDropdown1 = () => {
    setIsOpen1(!isOpen1);
  };

  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    try {
      const response = await icoService.getAllICOs();
      const data = response.map((launchpad) => {
        const isAutoListed = launchpad.isAutoListed;
        let status = "Not Listed";

        if (isAutoListed == true) {
          status = "Listed";
        }

        return { ...launchpad, status };
      });
      const filteredData = data.filter(
        (launchpad) => launchpad.isEnableListing == true
      );
      setLaunchpadData(filteredData);
      setFilteredLaunchpad(filteredData);
      setIsLoading(false);
      setSearchQuery("");
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
    }
  }

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const filtered = launchpadData.filter(
      (launch) =>
        launch?.tokenInfo.name.toLowerCase().includes(query.toLowerCase()) ||
        launch?.tokenInfo.symbol.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredLaunchpad(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    filterLaunchpads();
  }, [filter, statusFilter, searchQuery]);

  const filterLaunchpads = () => {
    let filteredData = launchpadData;

    if (filter === "Listed") {
      filteredData = filteredData.filter(
        (launchpad) => launchpad.isAutoListed === true
      );
    }

    if (statusFilter !== "No filter") {
      filteredData = filteredData.filter(
        (launchpad) => launchpad.status === statusFilter
      );
    }

    if (searchQuery !== "") {
      filteredData = filteredData.filter(
        (launch) =>
          launch?.tokenInfo.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          launch?.tokenInfo.symbol
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLaunchpad(filteredData);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setIsOpen1(false);
  };

  const myLaunchpad = launchpadData.filter((launch) => {
    return launch.creatorAddress == walletAddress;
  });
  // Pagination calculations
  const indexOfLastToken = currentPage * salesPerPage;
  const indexOfFirstToken = indexOfLastToken - salesPerPage;
  const currentLaunchpad =
    filteredLaunchpad?.slice(indexOfFirstToken, indexOfLastToken) || [];
  const totalPages = Math.ceil(filteredLaunchpad?.length / salesPerPage);

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
    <div className="overflow-hidden flex flex-col w-full mb-24 justify-center mx-auto rounded-2xl py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white">
      {/* Header */}
      <div className="my-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-2">
          <div className="">
            {" "}
            <p className="font-black tracking-wide text-2xl lg:text-3xl mb-1">
              Auto-Listing
            </p>
          </div>
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
              {launchpadData.length}
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
            My Projects{" "}
            <span className="ms-1 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-300">
              {myLaunchpad.length}
            </span>
          </button>
        </nav>

        {/* Search + Filter */}
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

          <div className="flex gap-4 items-center justify-end">
            <div className="relative">
              <button
                id="dropdownDelayButton1"
                onClick={toggleDropdown1}
                className="w-[8rem] text-safemoon-dark bg-white focus:outline-none outline-none font-medium rounded-2xl text-sm py-2 sm:py-2 px-3 sm:px-4 text-center inline-flex items-center justify-between dark:bg-white/10 dark:text-white"
                type="button"
              >
                Status{" "}
                {isOpen1 ? (
                  <RiArrowDropUpLine size="20px" />
                ) : (
                  <RiArrowDropDownLine size="20px" />
                )}
              </button>

              {isOpen1 && (
                <div
                  id="dropdownDelay1"
                  className="z-50 absolute top-full right-0 bg-white divide-y p-4 divide-gray-100 rounded-2xl shadow-xl w-44 dark:bg-[#282828]"
                >
                  <ul
                    className="text-md text-gray-700 dark:text-gray-200"
                    aria-labelledby="dropdownDelayButton1"
                  >
                    {["No filter", "Listed", "Not Listed"].map((status) => (
                      <li key={status}>
                        <button
                          onClick={() => handleStatusFilterChange(status)}
                          className="text-xs flex justify-between w-full px-3 py-2 font-medium text-left bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-200 dark:hover:bg-white/10 rounded-md"
                        >
                          {status}{" "}
                          {statusFilter === status ? (
                            <span className="text-sm text-white">
                              <RiRocket2Fill />
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Launchpad Data */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col dark:border-gray-600 rounded-2xl shadow-sm text-safemoon-dark font-medium bg-white border dark:text-white dark:bg-[#282828] p-6 lg:p-8 animate-pulse"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-2xl"></div>
                    <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  </div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-2xl mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-2xl mb-4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-2xl mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-2xl mb-4"></div>
                  <div className="flex gap-2 items-center mb-4">
                    <div className="h-6 w-6 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-2xl w-3/4"></div>
                  </div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-2xl mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-2xl mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-2xl mb-4"></div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                    <div className="bg-gray-300 h-2.5 rounded-full"></div>
                  </div>
                  <div className="flex justify-between gap-4 items-center">
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-2xl w-1/2"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-2xl w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : currentLaunchpad.length === 0 ? (
            <div className="flex justify-center items-center min-h-72 w-full">
              <div className="flex justify-center gap-2 flex-col items-center mb-8">
                <RiRocket2Fill size="50px" />
                No Autolist
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {currentLaunchpad.map((token, index) => (
                  <div
                    key={index}
                    className="flex flex-col dark:border-gray-600 rounded-2xl shadow-sm text-safemoon-dark font-medium bg-white border dark:text-white dark:bg-[#282828] p-6 lg:p-8"
                  >
                    <div className="flex justify-between items-center">
                      <img
                        src={token.logo}
                        alt={token.title}
                        className="h-6 md:h-10 w-6 md:w-10 mr-2 rounded-2xl"
                      />
                      <div
                        className={`p-1 px-2  text-[0.6rem] rounded-full font-semibold ${
                          token.status == "Listed"
                            ? "border-green-600 text-green-600 bg-green-100"
                            : token.status == "Not Listed"
                            ? "border-red-600 text-red-600 bg-red-100"
                           : null
                        } `}
                      >
                        {token.status}
                      </div>
                    </div>

                    <div className="mt-2 font-black text-xl">{token.title}</div>

                    <div className=" mt-6">
                      <Link
                        to={`/admin/autolist/${token._id}`}
                        className="py-2 cursor-pointer font-semibold text-center px-4 xl:px-8 rounded-2xl text-xs xl:text-sm dark:bg-white dark:hover:bg-white/10 hover:text-safemoon-dark hover:bg-black/20 dark:hover:text-white text-white bg-safemoon-dark dark:text-black hover:shadow-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              {filteredLaunchpad?.length > 0 && (
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
        </div>
      </div>
    </div>
  );
};

export default AdminList;
