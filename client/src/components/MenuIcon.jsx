import React from "react";
import { Link, useLocation } from "react-router-dom";
import { RiArrowDropDownLine, RiArrowDropUpLine } from "react-icons/ri";

const MenuIcon = ({
  icon,
  title,
  url,
  subItems,
  isOpen,
  toggleDropdown,
  redirect,
  isMenuOpen,
  toggleMenu,
  isComingSoon,
}) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname == path
      ? "dark:border-gray-600 rounded-2xl shadow-sm text-safemoon-dark font-semibold bg-white border dark:text-white dark:bg-[#282828]"
      : "border-transparent font-light text-white rounded-2xl dark:text-gray-300 dark:hover:bg-[#282828] dark:hover:text-white hover:bg-white hover:font-semibold hover:text-safemoon-dark hover:shadow-sm border dark:hover:border-gray-600";
  };

  return (
    <div className="relative group ">
      <Link
        className={`flex flex-row items-center cursor-pointer transition ease-in-out delay-150 justify-between ml-6 mr-5 text-base tracking-wide p-2 my-1 ${isActive(
          url
        )}`}
        to={url}
        {...(redirect ? { target: "_blank" } : {})}
        onClick={subItems ? toggleDropdown : toggleMenu}
      >
        <div className="flex gap-2 justify-center items-center ">
          {icon}
          <span className="flex flex-row items-center gap-1 justify-between">
            <span className="">{title}</span>
            <div>
            {isComingSoon && (
              <div className="px-2 py-1 text-xs font-semibold text-black bg-white dark:bg-safemoon-light rounded-full">
                Soon
              </div>
            )}
            </div>
            
          </span>
        </div>
        {!!subItems && (
          <>
            {isOpen ? (
              <RiArrowDropUpLine size={24} />
            ) : (
              <RiArrowDropDownLine size={24} />
            )}
          </>
        )}
      </Link>
      {subItems && isOpen && (
        <div className="mt-2 w-50 ml-8 text-base flex flex-col rounded-2xl font-light ">
          {subItems.map((item, index) => (
            <Link
              key={index}
              onClick={toggleMenu}
              to={item.url}
              className={`flex flex-row items-center cursor-pointer transition ease-in-out delay-150 justify-between ml-6 mr-5 text-base tracking-wide p-2 pl-4 my-1 ${isActive(
                item.url
              )}`}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuIcon;
