import React, { createContext, useContext, useState, useEffect } from 'react';
import 'tailwindcss/tailwind.css';

const DarkModeContext = createContext();

export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Retrieve the initial value from local storage, defaulting to true if not found
    const savedDarkMode = localStorage.getItem('isDarkMode');
    return savedDarkMode !== null ? JSON.parse(savedDarkMode) : true;
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('isDarkMode', JSON.stringify(newMode)); // Save to local storage
      return newMode;
    });
  };

  useEffect(() => {
    // Save the current state to local storage whenever it changes
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);
