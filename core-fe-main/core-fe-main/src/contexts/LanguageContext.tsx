import React, { useState } from 'react';
import { createContext } from 'use-context-selector';

interface Language {
  readonly language: string;
  readonly setLanguage: any;
}

interface LanguageContextProviderProps {
  readonly children: JSX.Element[] | JSX.Element;
}

export const LanguageContext = createContext<Language>({} as any);

export const LanguageContextProvider: React.FC<LanguageContextProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState('en');
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
