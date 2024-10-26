import React from "react";

const LockModal = ({ isOpen, closeModal }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50">
      <div className="text-safemoon-alt   px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-md w-full z-[1000]">
        {/* Modal Content Here */}
        <h2 className="text-base md:text-lg font-semibold mb-4">Lock Information</h2>
        {/* Lock Ended Information */}
        <div className="mb-4">
          <p className="text-gray-500">Lock ended</p>
          <p>Tokens have been claimed 2024.04.12, 10:04</p>
        </div>

        {/* Total Amount Locked */}
        <div className="mb-4">
          <p className="text-gray-500">Total Amount Locked</p>
          <p>300 000 000 000</p>
        </div>
        {/* Owner */}
        <div className="mb-4">
          <p className="text-gray-500">Owner</p>
          <p>EQDz5MZtw-MlGeZXvDZUUnLpMUkmdzbxWdTPX1he9NJHFlvC</p>
        </div>
        {/* Lock Date */}
        <div className="mb-4">
          <p className="text-gray-500">Lock Date</p>
          <p>2024.04.12, 10:03</p>
        </div>
        {/* First Unlock Date */}
        <div className="mb-4">
          <p className="text-gray-500">First Unlock Date</p>
          <p>2024.04.12, 10:04</p>
        </div>
        {/* TGE (%) */}
        <div className="mb-4">
          <p className="text-gray-500">TGE (%)</p>
          <p>100%</p>
        </div>
        {/* TGE (Jettons) */}
        <div className="mb-4">
          <p className="text-gray-500">TGE (Jettons)</p>
          <p>300 000 000 000 LP</p>
        </div>
        <button
          className="py-2 px-3 rounded-2xl text-md text-center font-medium dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-safemoon-dark dark:text-gray-300 basis-1/12"
          onClick={closeModal}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default LockModal;
