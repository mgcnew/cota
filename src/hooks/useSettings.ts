import { useState, useEffect } from "react";

export interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    quotes: boolean;
    orders: boolean;
    suppliers: boolean;
  };
  display: {
    compactMode: boolean;
    showMetrics: boolean;
    animationsEnabled: boolean;
  };
  system: {
    language: string;
    dateFormat: string;
    currency: string;
  };
}

const defaultSettings: Settings = {
  notifications: {
    email: true,
    push: true,
    quotes: true,
    orders: true,
    suppliers: true,
  },
  display: {
    compactMode: false,
    showMetrics: true,
    animationsEnabled: true,
  },
  system: {
    language: "pt-BR",
    dateFormat: "DD/MM/YYYY",
    currency: "BRL",
  },
};

const STORAGE_KEY = "cotacoes-settings";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const updateNotifications = (updates: Partial<Settings["notifications"]>) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...updates },
    }));
  };

  const updateDisplay = (updates: Partial<Settings["display"]>) => {
    setSettings((prev) => ({
      ...prev,
      display: { ...prev.display, ...updates },
    }));
  };

  const updateSystem = (updates: Partial<Settings["system"]>) => {
    setSettings((prev) => ({
      ...prev,
      system: { ...prev.system, ...updates },
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    settings,
    updateSettings,
    updateNotifications,
    updateDisplay,
    updateSystem,
    resetSettings,
  };
}
