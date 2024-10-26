import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast, Flip } from "react-toastify";
import { isAfter, isEqual } from "date-fns";

const SetTimeModal = ({ closeModal, launchpadData, updateICOTimes }) => {
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [dexTime, setDexTime] = useState(null);

  useEffect(() => {
    if (launchpadData?.start) {
      setStartTime(new Date(launchpadData.start));
    } else {
      setStartTime(new Date());
    }
    if (launchpadData?.end) {
      setEndTime(new Date(launchpadData.end));
    } else {
      setEndTime(new Date());
    }

    if (launchpadData?.dexTime) {
      setDexTime(new Date(launchpadData.dexTime));
    }
  }, [launchpadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAfter(endTime, startTime) || isEqual(endTime, startTime)) {
      toast.error("End time must be after start time", {
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
    if (dexTime) {
      if (!isAfter(dexTime, endTime) || isEqual(endTime, dexTime)) {
        toast.error("End time must be before listing time", {
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
    }
    try {
      await updateICOTimes(startTime, endTime);
      toast.success("Sale period updated!", {
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
      toast.error("Error saving sale period");
    }
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-600 bg-opacity-75 z-30">
      <div className="text-safemoon-alt px-4 md:px-4 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-xl w-[90%] mt-20 z-[1000]">
        <h2 className="text-base md:text-lg font-semibold mb-4">
          Set Start and End Times
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-4 mb-4 justify-center">
            <div className="">
              <label className="block text-white text-sm font-medium mb-2">
                Start Time
                <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={startTime}
                onChange={(date) => setStartTime(date)}
                showTimeSelect
                required
                dateFormat="Pp"
                className="shadow appearance-none border rounded-2xl w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
              />
            </div>
            <div className="">
              <label className="block text-white text-sm font-medium mb-2">
                End Time
                <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={endTime}
                required
                onChange={(date) => setEndTime(date)}
                showTimeSelect
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
              Set Times
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetTimeModal;
