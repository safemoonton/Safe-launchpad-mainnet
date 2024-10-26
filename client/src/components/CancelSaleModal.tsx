const CancelSaleModal = ({ closeModal, cancelSale }) => {
  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-500 bg-opacity-75 z-50">
      <div className="text-safemoon-alt  px-4 md:px-4 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-dark text-white p-6 rounded-2xl shadow-md max-w-md w-[90%] mt-20 z-[1000]">
        <h2 className="text-base md:text-lg font-semibold mb-4">Cancel Sale</h2>
        <p className="mb-4 tracking-wide text-sm">
          Are you sure you want to cancel this sale?
        </p>
        <div className="flex gap-4 ">
          <button
            className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-red-500 dark:hover:bg-red-700 text-white bg-red-500 dark:hover:text-white hover:text-white hover:bg-red-700 dark:text-white"
            onClick={() => closeModal(null)}
          >
            Close
          </button>
          <button
            className="py-2 sm:py-2 px-6 my-1 sm:px-4 rounded-2xl text-xs font-medium  dark:border-0 text-md text-center dark:bg-white/30 dark:hover:bg-white/10 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/50 dark:text-gray-300"
            onClick={() => cancelSale()}
          >
            Cancel Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelSaleModal;
