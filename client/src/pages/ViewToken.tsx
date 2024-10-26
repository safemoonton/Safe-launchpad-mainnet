import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { RiArrowLeftLine } from "react-icons/ri";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaCopy, FaCheckCircle } from "react-icons/fa";
import { toast, Flip } from "react-toastify";
import { formatNumber, makeElipsisAddress } from "../helpers";
import { getTokenDataNew } from "../helpers/tonApi";

const ViewToken = () => {
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    decimals: "",
    description: "",
    logo: "",
    admin_address: "",
    contract_address: "",
    total_supply: "",
  });
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useParams();

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    getData(address);
  }, [address]);

  async function getData(address) {
    try {
      const data = await getTokenDataNew(address);
      setFormData(data);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      toast.error(`Error getting token details`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
    }
  }

  return (
    <div className="flex flex-col w-full mb-24  justify-center mx-auto rounded-2xl py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl px-4 md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white ">
      <div className="my-4">
        <p className="font-black tracking-wide text-2xl lg:text-3xl mb-1 flex gap-3 items-center">
          <div onClick={() => navigate(-1)}>
            {" "}
            <RiArrowLeftLine size="25px" />
          </div>
          Token Information
        </p>
      </div>

      {formData.name && !isLoading ? (
        <div className="mb-4">
          <div className="p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl">
            <div className="flex justify-between">
              <div className="flex flex-col items-start lg:flex-row lg:items-center justify-start gap-4">
                <img
                  src={formData.logo}
                  alt={formData.name}
                  className="h-6 md:h-14 w-6 md:w-14 rounded-full bg-white"
                />
                <div>
                  <div className="text-3xl font-semibold">{formData.name}</div>
                </div>
              </div>
            </div>
            <div>
              <div className="my-4 pb-2">{formData.description}</div>
              <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                Admin Address{" "}
                <div className="flex items-center">
                  {" "}
                  {makeElipsisAddress(formData.admin_address, 7)}{" "}
                </div>
              </div>

              <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                Token Name <div> {formData.name}</div>
              </div>
              <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                Token Address
                <div className="flex items-center">
                  {" "}
                  {makeElipsisAddress(formData.contract_address, 7)}{" "}
                  <CopyToClipboard
                    text={formData.contract_address}
                    onCopy={handleCopy}
                  >
                    <button className="ml-2">
                      {copied ? <FaCheckCircle /> : <FaCopy />}
                    </button>
                  </CopyToClipboard>
                </div>
              </div>
              <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                Token Symbol <div>{formData.symbol}</div>
              </div>
              <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                Token Decimals <div>{formData.decimals}</div>
              </div>
              <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                Token Supply{" "}
                <div>
                  {formatNumber(formData.total_supply)} {formData.symbol}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="p-4 md:p-6 bg-white text-safemoon-dark dark:bg-transparent dark:text-white border dark:border-gray-600 rounded-2xl animate-pulse">
            <div className="flex justify-between">
              <div className="flex flex-col items-start lg:flex-row lg:items-center justify-start gap-4">
                <div className="h-6 md:h-14 w-6 md:w-14 rounded-full bg-gray-300"></div>
                <div>
                  <div className="text-3xl font-semibold bg-gray-300 h-8 w-20 lg:w-40 rounded-2xl"></div>
                </div>
              </div>
            </div>
            <div>
              <div className="my-4 pb-2 bg-gray-300 h-6 w-64 lg:w-96 rounded-2xl"></div>
              <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                <div className="bg-gray-300 h-6 w-20 lg:w-40 rounded-2xl"></div>
                <div className="flex items-center">
                  <div className="bg-gray-300 h-6 -32 lg:w-64 rounded-2xl"></div>
                </div>
              </div>
              <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                <div className="bg-gray-300 h-6 w-20 lg:w-40 rounded-2xl"></div>
                <div className="flex items-center">
                  <div className="bg-gray-300 h-6 w-32 lg:w-64 rounded-2xl"></div>
                  <button className="ml-2 bg-gray-300 h-6 w-6 rounded-2xl"></button>
                </div>
              </div>
              <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                <div className="bg-gray-300 h-6 w-20 lg:w-40 rounded-2xl"></div>
                <div className="bg-gray-300 h-6 w-32 lg:w-64 rounded-2xl"></div>
              </div>
              <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                <div className="bg-gray-300 h-6 w-20 lg:w-40 rounded-2xl"></div>
                <div className="bg-gray-300 h-6 w-32 lg:w-64 rounded-2xl"></div>
              </div>
              <div className="mt-2 pb-2 flex justify-between items-center border-b dark:border-gray-600">
                <div className="bg-gray-300 h-6 w-20 lg:w-40 rounded-2xl"></div>
                <div className="bg-gray-300 h-6 w-32 lg:w-64 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewToken;
