import React, { useEffect, useState } from "react";
import {
  RiSignalTowerLine,
  RiShieldKeyholeLine,
  RiBitCoinLine,
  RiShieldLine,
  RiFileTextLine,
  RiCoinLine,
  RiTwitterXLine,
  RiTelegramLine,
  RiMoonLine,
  RiSunLine,
  RiQuestionLine,
  RiListSettingsLine,
  RiCoinsLine,
} from "react-icons/ri";
import { PiRocketLaunchDuotone, PiHouseDuotone } from "react-icons/pi";
import { HiMenuAlt3 } from "react-icons/hi";
import { MdClose } from "react-icons/md";
import { useDarkMode } from "../context/DarkModeContext";
import MenuIcon from "./MenuIcon";

import Logo from "../assets/images/launchpad-logo.png";
import { useTonAddress, TonConnectButton } from "@tonconnect/ui-react";
import { Link } from "react-router-dom";
import { isAdmin } from "../assets/admin";
import config from "../config";

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [stars, setStars] = useState(null);
  const [submenuOpen, setSubmenuOpen] = useState(Array(11).fill(false));
  const currentYear = new Date().getFullYear();
  const { NETWORK } = config;

  const toggleSubmenu = (index) => {
    const newSubmenuOpen = [...submenuOpen].map((item, i) =>
      i === index ? !item : false
    );
    setSubmenuOpen(newSubmenuOpen);
  };

  useEffect(() => {
    renderStars();
  }, []);

  const renderStars = () => {
    const stars = [];
    const starCount = 1500;
    for (let i = 0; i < starCount; i++) {
      stars.push(
        <div
          key={i}
          className="star"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2}px`,
            height: `${Math.random() * 2}px`,
            opacity: `${Math.random()}`,
          }}
        ></div>
      );
    }
    setStars(stars);
  };
  const wallet = useTonAddress();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* ======= MAIN CONTAINER  ======= */}
      <div className={`${isDarkMode ? "dark" : ""}`}>
        {/* ======= BACKGROUND ======= */}
        <div className="space-background  w-full h-full bg-gradient-to-r from-[#0a0c31]  from-10% via-[#0a0e34] via-30% to-[#10305c] to-90% dark:from-black dark:from-10% dark:via-black dark:via-30& dark:to-90% dark:to-black">
          <div className="stars">{stars}</div>
          <div className="moon"></div>
          {/* ======= LAYOUT CONTAINER  ======= */}
          <div>
            {NETWORK !== "mainnet" && (
              <div className="bg-white dark:bg-safemoon-light text-black text-center text-sm font-semibold">
                This is a testnet version
              </div>
            )}

            {/* ======= HEADER CONTAINER  ======= */}
            <div className="flex justify-between items-center py-1 text-safemoon-alt bg-white/10 backdrop-blur-xl md:px-8 dark:bg-[#1c1c1c] dark:text-white bg-safemoon-alt text-white">
              <Link
                to="/"
                className=" flex flex-row gap-2 mx-2 lg:mx-0 items-center font-normal text-lg"
              >
                <img src={Logo} alt="logo" className="w-12 lg:w-14" />
                <span className="hidden md:block lg:block font-medium tracking-wider">
                  SafemoonPad
                </span>
              </Link>
              <div className="flex gap-2">
                <button
                  className="py-[0.2rem] px-[0.8rem] rounded-2xl mr-2 text-sm font-light dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white hover:text-white hover:bg-safemoon-dark dark:hover:text-white dark:text-gray-300"
                  onClick={() => {
                    toggleDarkMode();
                    renderStars();
                  }}
                >
                  {isDarkMode ? (
                    <RiMoonLine size="16px" />
                  ) : (
                    <RiSunLine size="16px" />
                  )}
                </button>

                <TonConnectButton
                  className="custom-button"
                  style={{ float: "right" }}
                />

                <button
                  className="py-[0.2rem] px-[0.8rem] xl:hidden block rounded-2xl mr-2 text-sm font-light dark:bg-black dark:hover:bg-white/10 text-safemoon-dark bg-white hover:text-white hover:bg-safemoon-dark dark:hover:text-white dark:text-gray-300"
                  onClick={toggleMenu}
                >
                  {isMenuOpen ? (
                    <MdClose size="20px" />
                  ) : (
                    <HiMenuAlt3 size="20px" />
                  )}
                </button>
              </div>
            </div>
            {/* ======= MAIN BODY CONTAINER  ======= */}
            <div className="flex flex-row z-10 h-screen overflow-y-auto">
              {/* ======= SIDEBAR CONTAINER  ======= */}
              <div
                className={`w-full h-screen z-10 fixed ${
                  NETWORK !== "mainnet"
                    ? "top-[76px] lg:top-[84px]"
                    : "top-[55px] lg:top-[64px]"
                } max-w-full md:max-w-80 lg:w-72 ease-in duration-200 
                  ${
                    isDarkMode
                      ? "bg-[#1c1c1c] text-white"
                      : "text-white bg-white/10 backdrop-blur-xl"
                  } ${
                  isMenuOpen
                    ? "left-[0px] translate-x-0 z-10 xl:block"
                    : "left-[-770px] translate-x-0  xl:left-[0px] xl:block"
                }`}
              >
                <div className="flex flex-col overflow-y-auto justify-between mt-2 h-[90vh]">
                  <div className="">
                    <MenuIcon
                      icon={<PiHouseDuotone size="25px" />}
                      title="Home"
                      url="/"
                      isOpen={submenuOpen[0]}
                      toggleDropdown={() => toggleSubmenu(0)}
                      isMenuOpen={isMenuOpen}
                      toggleMenu={() => setIsMenuOpen(false)}
                    />
                    <MenuIcon
                      icon={<RiBitCoinLine size="25px" />}
                      title="Create Token"
                      url="/token/create"
                      isOpen={submenuOpen[3]}
                      toggleDropdown={() => toggleSubmenu(3)}
                      isMenuOpen={isMenuOpen}
                      toggleMenu={() => setIsMenuOpen(false)}
                    />
                    <MenuIcon
                      icon={<PiRocketLaunchDuotone size="25px" />}
                      title="SAFE Launch"
                      isOpen={submenuOpen[0]}
                      url="/safe-launch"
                      toggleDropdown={() => toggleSubmenu(0)}
                      isMenuOpen={isMenuOpen}
                      toggleMenu={() => setIsMenuOpen(false)}
                    />
                    <MenuIcon
                      icon={<RiShieldLine size="25px" />}
                      title="Private Sales"
                      isOpen={submenuOpen[4]}
                      url="/safe-launch/private"
                      toggleDropdown={() => toggleSubmenu(4)}
                      isMenuOpen={isMenuOpen}
                      toggleMenu={() => setIsMenuOpen(false)}
                    />
                    <MenuIcon
                      icon={<RiSignalTowerLine size="25px" />}
                      title="SAFE Drop"
                      url="/safe-drop"
                      isOpen={submenuOpen[1]}
                      toggleDropdown={() => toggleSubmenu(1)}
                      isMenuOpen={isMenuOpen}
                      toggleMenu={() => setIsMenuOpen(false)}
                    />
                    <MenuIcon
                      icon={<RiShieldKeyholeLine size="25px" />}
                      title="SAFE Lock"
                      url="/safe-lock"
                      isOpen={submenuOpen[2]}
                      toggleDropdown={() => toggleSubmenu(2)}
                      isMenuOpen={isMenuOpen}
                      toggleMenu={() => setIsMenuOpen(false)}
                    />

                    {wallet && isAdmin(wallet) && (
                      <MenuIcon
                        icon={<RiListSettingsLine size="25px" />}
                        title="Auto Listing"
                        url="/admin/autolist"
                        isOpen={submenuOpen[3]}
                        toggleDropdown={() => toggleSubmenu(3)}
                        isMenuOpen={isMenuOpen}
                        toggleMenu={() => setIsMenuOpen(false)}
                      />
                    )}
                    {wallet && (
                      <MenuIcon
                        icon={<RiCoinsLine size="25px" />}
                        title="My Tokens"
                        url="/token/my-tokens"
                        isOpen={submenuOpen[3]}
                        toggleDropdown={() => toggleSubmenu(3)}
                        isMenuOpen={isMenuOpen}
                        toggleMenu={() => setIsMenuOpen(false)}
                      />
                    )}
                  </div>
                  <div className="">
                    <MenuIcon
                      icon={<RiFileTextLine size="25px" />}
                      title="Docs"
                      url="https://safemoonton.gitbook.io/docs"
                      isOpen={submenuOpen[6]}
                      redirect
                      toggleDropdown={() => toggleSubmenu(6)}
                      isMenuOpen={isMenuOpen}
                      toggleMenu={() => setIsMenuOpen(false)}
                    />
                    <MenuIcon
                      icon={<RiCoinLine size="25px" />}
                      title="Buy $SAFET"
                      url="https://app.ston.fi/swap?chartVisible=false&ft=TON&tt=EQBgLw3RLkELgOJUU1oHtHzwkoTdb4RgfT8IgTG6k_iLneEc"
                      isOpen={submenuOpen[7]}
                      redirect
                      toggleDropdown={() => toggleSubmenu(7)}
                      isMenuOpen={isMenuOpen}
                      toggleMenu={() => setIsMenuOpen(false)}
                    />
                    <div className="mb-8" />
                    <MenuIcon
                      icon={<RiQuestionLine size="25px" />}
                      title="About $SAFET"
                      url="https://safemoonton.gitbook.io/docs"
                      isOpen={submenuOpen[6]}
                      redirect
                      toggleDropdown={() => toggleSubmenu(6)}
                      isMenuOpen={isMenuOpen}
                      toggleMenu={() => setIsMenuOpen(false)}
                    />
                    <MenuIcon
                      icon={<RiTwitterXLine size="25px" />}
                      title="Twitter/X"
                      url="https://twitter.com/Safemoon_Ton"
                      redirect
                      isOpen={submenuOpen[8]}
                      toggleDropdown={() => toggleSubmenu(8)}
                      isMenuOpen={isMenuOpen}
                      toggleMenu={() => setIsMenuOpen(false)}
                    />
                    <MenuIcon
                      icon={<RiTelegramLine size="25px" />}
                      title="Telegram"
                      url="https://t.me/SafemoonTon"
                      redirect
                      isOpen={submenuOpen[9]}
                      toggleDropdown={() => toggleSubmenu(9)}
                      isMenuOpen={isMenuOpen}
                      toggleMenu={() => setIsMenuOpen(false)}
                    />
                    <footer className="text-center text-xs my-4">
                      <p>&copy; {currentYear} Safemoon Launchpad Beta</p>
                    </footer>
                  </div>
                </div>
              </div>
              {/* ======= BODY CONTENT CONTAINER  ======= */}
              <div
                className={`w-full lg:flex xl:ml-80  lg:justify-center h-max text-base text-white mx-4 mt-4 md:m-8 ease-out duration-100  ${
                  isMenuOpen ? "hidden md:block" : ""
                }`}
              >
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
