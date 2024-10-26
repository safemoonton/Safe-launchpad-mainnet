import React, { useState } from "react";
import { toast, Flip } from "react-toastify";
import { parseICOEntries } from "../helpers";

const SetWhitelistModal = ({
  whitelistData,
  type,
  closeModal,
  updateWhitelistData,
}) => {
  const [whitelistType, setWhitelistType] = useState(type);
  const [basicWhitelist, setBasicWhitelist] = useState(
    whitelistData.basic || ""
  );
  const [tieredWhitelist, setTieredWhitelist] = useState(
    whitelistData.tiered || []
  );

  const handleBasicInputChange = (e) => {
    setBasicWhitelist(e.target.value);
  };

  const handleTierChange = (index, field, value) => {
    const newTieredWhitelist = [...tieredWhitelist];
    newTieredWhitelist[index][field] = value;
    setTieredWhitelist(newTieredWhitelist);
  };

  const addTier = () => {
    if (tieredWhitelist.length < 3) {
      setTieredWhitelist([...tieredWhitelist, { addresses: "", delay: 0 }]);
    } else {
      toast.warning("You can only add up to 3 tiers.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
    }
  };

  const removeTier = (index) => {
    const newTieredWhitelist = tieredWhitelist.filter((_, i) => i !== index);
    setTieredWhitelist(newTieredWhitelist);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let whitelist;
      if (whitelistType === "basic") {
        whitelist = basicWhitelist;
      } else {
        whitelist = tieredWhitelist;
      }

      await updateWhitelistData(whitelistType, whitelist);
      toast.success("Whitelists updated successfully!", {
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
      console.error(error);
      toast.error("Error saving whitelists");
    }
  };

  const tierLabels = ["Tier A", "Tier B", "Tier C"];

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-600 bg-opacity-75 z-30">
      <div className="text-safemoon-alt px-4 md:px-4 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-xl max-h-[35rem]  overflow-y-auto w-[90%] mt-20 z-[1000]">
        <h2 className="text-base md:text-lg font-semibold mb-4">Create/Update Whitelists</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-white dark:text-gray-300 text-md font-medium tracking-wide block mb-2">
              Select Whitelist Type
            </label>
            <div className="flex items-center mb-4">
              <input
                type="radio"
                id="basic"
                name="whitelistType"
                value="basic"
                checked={whitelistType === "basic"}
                onChange={() => setWhitelistType("basic")}
                className="w-4 h-4 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="basic"
                className="ml-2 text-sm font-medium text-whute dark:text-gray-300"
              >
                Basic Whitelist
              </label>
            </div>
            <div className="flex items-center mb-4">
              <input
                type="radio"
                id="tiered"
                name="whitelistType"
                value="tiered"
                checked={whitelistType === "tiered"}
                onChange={() => setWhitelistType("tiered")}
                className="w-4 h-4 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="tiered"
                className="ml-2 text-sm font-medium text-white dark:text-gray-300"
              >
                Tiered Whitelist
              </label>
            </div>
          </div>

          {whitelistType === "basic" && (
            <div className="mb-4">
              <textarea
                className="shadow appearance-none border rounded-2xl text-sm w-full resize-none py-3 px-3 text-gray-700 leading-tight focus:outline-none"
                value={basicWhitelist}
                rows={10}
                id="basicWhitelist"
                name="basicWhitelist"
                required
                placeholder={`address,address,address`}
                onChange={handleBasicInputChange}
              ></textarea>
            </div>
          )}

          {whitelistType === "tiered" && (
            <div className="mb-4">
              {tieredWhitelist?.map((tier, index) => (
                <div key={index} className="mb-2 border-b pb-2">
                  <h3 className="text-sm font-medium mb-2">
                    {tierLabels[index]}
                  </h3>
                  <textarea
                    className="shadow appearance-none border rounded-2xl text-sm w-full resize-none py-3 px-3 text-gray-700 leading-tight focus:outline-none mb-2"
                    value={tier.addresses}
                    rows={4}
                    placeholder="address,address,address"
                    onChange={(e) =>
                      handleTierChange(index, "addresses", e.target.value)
                    }
                  ></textarea>
                  <input
                    type="number"
                    className="shadow appearance-none border rounded-2xl text-sm w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none mb-2"
                    value={tier.delay}
                    placeholder="Delay (in minutes)"
                    onChange={(e) =>
                      handleTierChange(index, "delay", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="py-1 px-2 rounded-2xl text-xs font-medium bg-red-500 text-white hover:bg-red-700"
                    onClick={() => removeTier(index)}
                  >
                    Remove Tier
                  </button>
                </div>
              ))}
              {tieredWhitelist.length < 3 && (
                <button
                  type="button"
                  className="py-2 px-4 rounded-2xl text-xs font-medium bg-blue-500 text-white hover:bg-blue-700"
                  onClick={addTier}
                >
                  Add Tier
                </button>
              )}
            </div>
          )}

          <div className="flex gap-4 flex-wrap">
            <button
              className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-red-500 dark:hover:bg-red-700 text-white bg-red-500 dark:hover:text-white hover:text-white hover:bg-red-700 dark:text-white"
              onClick={() => closeModal(null)}
              type="button"
            >
              Close
            </button>
            <button
              className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-white/30 dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/50 dark:text-gray-300"
              type="submit"
            >
              Add Whitelists
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetWhitelistModal;
