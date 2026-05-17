"use client";

import { createContext, useContext, useEffect, useState } from "react";

type TestModeContextValue = {
  isTestMode: boolean;
  setIsTestMode: (v: boolean) => void;
};

const TestModeContext = createContext<TestModeContextValue>({
  isTestMode: false,
  setIsTestMode: () => {},
});

export function TestModeProvider({ children }: { children: React.ReactNode }) {
  const [isTestMode, setIsTestModeState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("record:testMode");
    if (stored === "true") setIsTestModeState(true);
  }, []);

  const setIsTestMode = (v: boolean) => {
    setIsTestModeState(v);
    localStorage.setItem("record:testMode", String(v));
  };

  return (
    <TestModeContext.Provider value={{ isTestMode, setIsTestMode }}>
      {children}
    </TestModeContext.Provider>
  );
}

export function useTestMode() {
  return useContext(TestModeContext);
}
