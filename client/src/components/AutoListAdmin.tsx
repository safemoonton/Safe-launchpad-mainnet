const AutoListAdmin = ({
  launchpadData,
  allContribution,
  status,
  handleModal,
}) => {
  return (
    <>
      {status != "Listed" ? (
        <div className="mb-4 p-4 rounded-2xl border dark:border-gray-600 bg-white text-safemoon-dark dark:bg-transparent dark:text-white">
          <p className="mb-2 font-semibold text-lg">Platform Owner Area</p>
          <div className="mt-4">
            {launchpadData.isClaimedLeftover &&
              launchpadData.isClaimedRaise && (
                <button
                  onClick={() => handleModal("autolist")}
                  className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                >
                  Update Listing Info
                </button>
              )}
            {!launchpadData.isClaimedLeftover && (
              <button
                onClick={() => handleModal("reclaim")}
                className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
              >
                Withdraw {launchpadData.tokenInfo.symbol}
              </button>
            )}
            {!launchpadData.isClaimedRaise && (
              <button
                onClick={() => handleModal("claimFunds")}
                className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
              >
                Withdraw {allContribution} TON
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4 p-4 rounded-2xl border dark:border-gray-600">
          <p className="mb-2 font-semibold text-lg">Platform Owner Area</p>
          <div className="mt-4">
            <div className="font-semibold">This token has been listed</div>
          </div>
        </div>
      )}
    </>
  );
};

export default AutoListAdmin;
