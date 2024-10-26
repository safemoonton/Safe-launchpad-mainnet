import { useTonAddress } from "@tonconnect/ui-react";
import { parseISO, isFuture } from "date-fns";
import Timer from "./Timer";

const LaunchpadAdmin = ({
  launchpadData,
  allContribution,
  status,
  handleModal,
}) => {
  const walletAddress = useTonAddress();
  function checkWhitelist(data) {
    if (data.whitelistType == "basic" && data.basicWhitelist?.length !== 0) {
      return true;
    } else if (
      data.whitelistType == "tiered" &&
      data?.tieredWhitelist.length !== 0
    ) {
      return true;
    } else {
      return false;
    }
  }

  const isStartTimeInFuture = (startTime) => {
    if (!startTime) return true;
    return isFuture(parseISO(startTime));
  };

  return (
    <>
      {status != "Cancelled" ? (
        <div className="mb-4 p-4 rounded-2xl border dark:border-gray-600 bg-white text-safemoon-dark dark:bg-transparent dark:text-white">
          <p className="mb-2 font-semibold text-lg">Admin Area</p>
          {(status != "Cancelled" || status != "Ended") && (
            <>
              <p className="my-1">
                {isStartTimeInFuture(launchpadData?.start)
                  ? "Presale starts in:"
                  : "Presale ends in:"}
              </p>
              {launchpadData.start ? (
                <Timer
                  startTime={launchpadData.start}
                  endTime={launchpadData.end}
                />
              ) : (
                <p className="text-center text-xs text-red-400">
                  Update sale time to show timer
                </p>
              )}
            </>
          )}
          {status != "Cancelled" && (
            <div className="mt-4">
              {checkWhitelist(launchpadData) &&
                isStartTimeInFuture(launchpadData?.start) && (
                  <button
                    onClick={() => handleModal("setTime")}
                    className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                  >
                    {launchpadData?.start !== undefined ? "Update" : "Set"}{" "}
                    Start/End Time
                  </button>
                )}
              {isStartTimeInFuture(launchpadData?.start) &&
                status != "Cancelled" && (
                  <button
                    onClick={() => handleModal("cancelSale")}
                    className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                  >
                    Cancel Sale
                  </button>
                )}

              {!isStartTimeInFuture(launchpadData?.end) && (
                <>
                  {Number(allContribution) >= Number(launchpadData.soft_cap) ? (
                    <>
                      {launchpadData.isClaimedRaise ? (
                        <p>This sale has been completed successfully</p>
                      ) : (
                        <button
                          onClick={() => handleModal("claimFunds")}
                          className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                        >
                          Withdraw {allContribution} TON
                        </button>
                      )}

                      {!launchpadData.isClaimedLeftover && (
                        <button
                          onClick={() => handleModal("reclaim")}
                          className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                        >
                          Reclaim {launchpadData.tokenInfo.symbol}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {!launchpadData.isClaimedLeftover && (
                        <div>
                          {launchpadData.tokenInfo.symbol}'s Sale failed to
                          reach Soft Cap of {launchpadData.soft_cap} TON.
                          Contributors will get a refund.
                          <br />
                          <br /> <br /> To get your tokens back click the button
                          below
                          <button
                            onClick={() => handleModal("reclaim")}
                            className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                          >
                            Reclaim {launchpadData.tokenInfo.symbol}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {launchpadData.launchpadType == "private" &&
            (status === "Upcoming" || launchpadData.start == undefined) && (
              <div className="mt-4">
                <div className="font-semibold">Whitelist Control</div>
                <button
                  onClick={() => handleModal("whitelist")}
                  className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                >
                  Create/Update Whitelist
                </button>
                <button
                  onClick={() => handleModal("delete")}
                  className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                >
                  Clear Whitelist
                </button>
              </div>
            )}
        </div>
      ) : (
        <>
          {!launchpadData.isClaimedLeftover && (
            <div className="mb-4 p-4 rounded-2xl border dark:border-gray-600">
              <p className="mb-2 font-semibold text-lg">Admin Area</p>
              <div className="mt-4">
                <div className="font-semibold">
                  This sale has been cancelled, kindly reclaim your tokens
                </div>
                <button
                  onClick={() => handleModal("reclaim")}
                  className="py-2 sm:py-2 px-5 my-1 w-full sm:px-4 rounded-2xl text-xs font-medium  border border-safemoon-dark dark:border-0 dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300"
                >
                  Reclaim {launchpadData.tokenInfo.symbol}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default LaunchpadAdmin;
