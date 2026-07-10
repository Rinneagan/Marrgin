"use client";

import React, { createContext, useContext, useState } from "react";

interface ZenContextType {
  isZenMode: boolean;
  setZenMode: (val: boolean) => void;
  ambientColor: string | null;
  setAmbientColor: (val: string | null) => void;
}

const ZenContext = createContext<ZenContextType>({
  isZenMode: false,
  setZenMode: () => {},
  ambientColor: null,
  setAmbientColor: () => {},
});

export const ZenProvider = ({ children }: { children: React.ReactNode }) => {
  const [isZenMode, setZenMode] = useState(false);
  const [ambientColor, setAmbientColor] = useState<string | null>(null);
  
  return (
    <ZenContext.Provider value={{ isZenMode, setZenMode, ambientColor, setAmbientColor }}>
      {children}
    </ZenContext.Provider>
  );
};

export const useZenMode = () => useContext(ZenContext);
