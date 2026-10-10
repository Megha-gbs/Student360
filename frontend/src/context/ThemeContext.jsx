import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    localStorage.setItem('student360_theme', 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', setTheme: () => {}, resolvedTheme: 'light', isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return { theme: 'light', setTheme: () => {}, resolvedTheme: 'light', isDark: false };
  }
  return context;
}
