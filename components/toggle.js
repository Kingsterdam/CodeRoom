import React, { useState } from 'react';

function Toggle() {
  const [isActive, setIsActive] = useState(false);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  return (
    <nav
      className={`${
        isActive ? 'w-[350px] lg:w-[800px]' : 'w-[60px] lg:w-[70px]'
      } p-4 flex items-center justify-center rounded-md transition-all duration-500 overflow-hidden`}
    >
      <ul
        className={`flex list-none p-0 m-0 ${
          isActive ? 'w-full' : 'w-0'
        } transition-all duration-500 overflow-hidden gap-2 lg:gap-8`}
      >
        {['Share', 'Home', 'About', 'Profile', 'Settings'].map((item, index) => (
          <li
            key={index}
            className={`${
              isActive
                ? 'opacity-100 rotate-y-360'
                : 'opacity-0 rotate-y-0'
            } transition-transform duration-500`}
          >
            <a
              href="#"
              className="relative text-black no-underline mx-2 lg:mx-6"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
      <button
        className="relative border-0 cursor-pointer h-5 w-5 flex items-center justify-center"
        onClick={handleToggle}
      >
        <div
          className={`absolute bg-black h-[2px] w-5 left-[2px] top-[6px] transition-transform duration-500 font-bold ${
            isActive ? '-rotate-[765deg] translate-y-[3px]' : ''
          }`}
        ></div>
        <div
          className={`absolute bg-black h-[2px] w-5 left-[2px] bottom-[6px] transition-transform duration-500 font-bold ${
            isActive ? 'rotate-[765deg] -translate-y-[3px]' : ''
          }`}
        ></div>
      </button>
    </nav>
  );
}

export default Toggle;
