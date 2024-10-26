import { makeElipsisAddress, formatNumber } from "../helpers";
const LockHistoryTable = ({ lockHistory }) => {
  return (
    <div className="my-4">
      {/* Table for large devices */}
      <div className="hidden lg:block w-full overflow-auto   rounded-2xl border-separate">
        <table className="w-full text-left">
          <thead>
            <tr className="text-white bg-gray-700 dark:text-gray-300">
              <th className="px-4 py-2">Owner</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Claimed</th>
            </tr>
          </thead>
          <tbody>
            {lockHistory?.map((token, index) => (
              <tr
                key={index}
                className={`border-t ${
                  index === 0
                    ? "border-none"
                    : "border-white dark:border-gray-600"
                }`}
              >
                <td className="px-4 pr-32 py-2">
                  {makeElipsisAddress(token.ownerAddress, 10)}
                </td>
                <td className="px-4 py-2">
                  {formatNumber(token.amount)} {token.tokenInfo.symbol}
                </td>
                <td className="px-4 py-2">{token.claimed ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card layout for small and medium devices */}
      <div className="lg:hidden space-y-4">
        {lockHistory?.map((token, index) => (
          <div
            key={index}
            className="border border-white dark:border-gray-600 rounded-2xl p-4 flex flex-col"
          >
            <div className="flex items-center mb-4">
              <div className="flex flex-col">
                <span className="font-semibold">
                  {" "}
                  {makeElipsisAddress(token.ownerAddress, 10)}
                </span>
              </div>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Amount:</span>{" "}
              {formatNumber(token.amount)}{" "}
              <span className="text-gray-400 dark:text-gray-400 text-sm">
                {token.tokenInfo.symbol}
              </span>
            </div>

            <div className="mb-2">
              <span className="font-semibold">Claimed:</span>{" "}
              {token.claimed ? "Yes" : "No"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LockHistoryTable;
