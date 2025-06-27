import React, { createContext, useContext, useState } from "react";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
  };
}

const lightColors = {
  background: "#ffffff",
  surface: "#f8fafc",
  primary: "#3b82f6",
  text: "#1f2937",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
  card: "#ffffff",
};

const darkColors = {
  background: "#111827",
  surface: "#1f2937",
  primary: "#60a5fa",
  text: "#f9fafb",
  textSecondary: "#d1d5db",
  border: "#374151",
  card: "#1f2937",
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);

  const colors = isDark ? darkColors : lightColors;

  const value = {
    isDark,
    toggleTheme,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
