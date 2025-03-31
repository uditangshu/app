import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../constants/theme';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof lightTheme;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: lightTheme,
  isLoading: true,
});

export const useTheme = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = '@app_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadThemePreference();
  }, []);

  const toggleTheme = async () => {
    try {
      // Use the state updater function to ensure we have the latest state
      setIsDarkMode(prevMode => {
        const newMode = !prevMode;
        // Save to AsyncStorage after state update
        AsyncStorage.removeItem(THEME_STORAGE_KEY)
          .then(() => AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light'))
          .catch(error => console.error('Error saving theme preference:', error));
        return newMode;
      });
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}; 