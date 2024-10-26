import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast, Flip } from "react-toastify";
import { isAfter, isEqual, parseISO } from "date-fns";

const SetDEXTimeModal = ({ closeModal, launchpadData, updateDEXTimes }) => {
  const [time, setTime] = useState(null);

  useEffect(() => {
    if (launchpadData?.dexTime) {
      setTime(new Date(launchpadData.dexTime));
    } else {
      setTime(new Date());
    }
  }, [launchpadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAfter(time, parseISO(launchpadData.end))) {
      toast.error("Listing time must be after sale ends", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
      return;
    }

    if (isEqual(time, parseISO(launchpadData.end))) {
      toast.error("Listing time must be after sale ends", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
      return;
    }

    try {
      await updateDEXTimes(time);
      toast.success("Listing Period updated!", {
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
      toast.error("Error saving listing period");
    }
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-600 bg-opacity-75 z-30">
      <div className="text-safemoon-alt px-4 md:px-4 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-xl w-[90%] mt-20 z-[1000]">
        <h2 className="text-base md:text-lg font-semibold mb-4">
          Set DEX Listing Time
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-4 mb-4 justify-center">
            <div className="">
              <label className="block text-white text-sm font-medium mb-2">
                Listing Time
                <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={time}
                onChange={(date) => setTime(date)}
                showTimeSelect
                required
                dateFormat="Pp"
                className="shadow appearance-none border rounded-2xl w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <button
              className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium dark:border-0 text-md text-center dark:bg-red-500 dark:hover:bg-red-700 text-white bg-red-500 dark:hover:text-white hover:text-white hover:bg-red-700 dark:text-white"
              onClick={() => closeModal(null)}
            >
              Close
            </button>
            <button
              className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium dark:border-0 text-md text-center dark:bg-white/30 dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/50 dark:text-gray-300"
              type="submit"
            >
              Set Time
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetDEXTimeModal;
