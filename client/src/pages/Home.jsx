import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const fetchedUrl = "/safet-bg-moved.svg";
  return (
    <div className="flex w-full flex-col gap-6 mb-24">
      <div
        className="block w-full rounded-2xl bg-cover bg-top p-6 lg:p-12 shadow-lg border border-gray-800"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.7)), url(${fetchedUrl})`,
        }}
      >
        <h1 className="font-black text-white text-4xl max-w-[500px] opacity-100">
          Your Gateway to Effortless Token Launches
        </h1>
        <p className="mt-6 lg:mt-12 text-base text-white max-w-[500px] opacity-100 ">
          Safemoonton Launchpad empowers anyone to launch their own token and
          conduct initial token sales with unparalleled ease whether you’re an
          experienced developer or a complete beginner.
        </p>
        <button
          onClick={() => navigate("/safe-launch/create")}
          className="mt-6 lg:mt-36 py-3 sm:py-2 px-5 sm:px-6 rounded-2xl text-sm font-semibold dark:bg-white dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
        >
          Launch Project
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-xl dark:bg-[#1c1c1c]  rounded-2xl border border-gray-800">
          <div className="w-full h-full flex flex-col justify-around items-center   p-6 lg:p-12  rounded-2xl bg-gradient-to-l from-white/10 via-fuchsia-400/20 to-white/10 dark:from-[#1c1c1c] dark:via-fuchsia-400/20 dark:to-[#1c1c1c]">
            <h1 className="font-black text-white text-3xl opacity-100">
              SAFE Launch
            </h1>
            <p className="lg:mt-12 my-4 text-base text-white text-center opacity-100 ">
              Launch your tokens on SAFE Launch to ensure a transparent and
              equitable distribution of tokens.
            </p>
            <button
              onClick={() => navigate("/safe-launch")}
              className="py-3 sm:py-2 px-5 sm:px-6 rounded-2xl text-sm font-semibold dark:bg-white dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
            >
              Check it out
            </button>
          </div>
        </div>
        <div className="w-full h-full bg-white/10 backdrop-blur-xl dark:bg-[#1c1c1c]  rounded-2xl border border-gray-800">
          <div className="flex flex-col justify-around items-center   p-6 lg:p-12  rounded-2xl bg-gradient-to-l from-white/10 via-green-400/20 to-white/10 dark:from-green-400/20 dark:via-[#1c1c1c] dark:to-green-400/20">
            <h1 className="font-black text-white text-3xl opacity-100">
              SAFE Lock
            </h1>
            <p className="lg:mt-12 my-4 text-base text-white text-center opacity-100 ">
              SAFE Lock ensures that your funds are safeguarded, promoting
              stability and trust in your token’s ecosystem.
            </p>
            <button
              onClick={() => navigate("/safe-lock")}
              className="py-3 sm:py-2 px-5 sm:px-6 rounded-2xl text-sm font-semibold dark:bg-white dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
            >
              Check it out
            </button>
          </div>
        </div>
        <div className="w-full h-full bg-white/10 backdrop-blur-xl dark:bg-[#1c1c1c]  rounded-2xl border border-gray-800">
          <div className="flex flex-col justify-around items-center   p-6 lg:p-12  rounded-2xl bg-gradient-to-l from-white/10 via-red-500/20 to-white/10 dark:from-[#1c1c1c] dark:via-red-200/20 dark:to-[#1c1c1c]">
            <h1 className="font-black text-white text-3xl opacity-100">
              SAFE Drop
            </h1>
            <p className="lg:mt-12 my-4 text-base text-white text-center opacity-100 ">
              Boost your token’s visibility and reward your community &
              supporters efficiently using SAFE Drop.
            </p>
            <button
              onClick={() => navigate("/safe-drop")}
              className="py-3 sm:py-2 px-5 sm:px-6 rounded-2xl text-sm font-semibold dark:bg-white dark:hover:bg-white/20 text-safemoon-dark bg-white dark:hover:text-white hover:text-white hover:bg-white/20 dark:text-safemoon-dark"
            >
              Check it out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
