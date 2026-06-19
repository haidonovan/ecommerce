"use client";

import { useCallback, useEffect, useState } from "react";

import { useOffline } from "@/hooks/useOffline";

const STORAGE_KEY = "pos-settings";

export const defaultPOSSettings = {
  currency: {
    primaryCurrency: "USD",
    showBothCurrencies: true,
    exchangeRate: 4100,
    lastUpdated: "",
  },
  tax: {
    enabled: true,
    taxName: "VAT",
    taxRate: 10,
    taxType: "exclusive",
    applyTo: {
      allProducts: true,
      specificCategories: false,
    },
    showTaxLineOnReceipt: true,
  },
  discount: {
    enabled: true,
    allowPercentDiscount: true,
    allowFixedDiscount: true,
    maxDiscountPercent: 20,
    managerPinThresholdPercent: 10,
    presets: [5, 10, 15],
  },
  storeInfo: {
    storeName: "MyShop",
    storeAddress: "Phnom Penh, Cambodia",
    phoneNumber: "",
    logoBase64: "",
    receiptFooterMessage: "Thank you for shopping!",
    receiptHeaderNote: "No. X, Street Y, Phnom Penh",
  },
  appearance: {
    theme: "light",
    posLayout: "comfortable",
    defaultLanguage: "en",
    receiptLanguage: "en",
  },
  printer: {
    printerType: "thermal-80",
    autoPrintAfterSale: false,
    receiptCopies: 1,
  },
  cashiers: {
    list: [],
    managerPin: "",
  },
};

function mergeSettings(base, next) {
  return {
    ...base,
    ...next,
    currency: { ...base.currency, ...(next?.currency || {}) },
    tax: {
      ...base.tax,
      ...(next?.tax || {}),
      applyTo: { ...base.tax.applyTo, ...(next?.tax?.applyTo || {}) },
    },
    discount: { ...base.discount, ...(next?.discount || {}) },
    storeInfo: { ...base.storeInfo, ...(next?.storeInfo || {}) },
    appearance: { ...base.appearance, ...(next?.appearance || {}) },
    printer: { ...base.printer, ...(next?.printer || {}) },
    cashiers: { ...base.cashiers, ...(next?.cashiers || {}) },
  };
}

function readLocalSettings() {
  if (typeof window === "undefined") {
    return defaultPOSSettings;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? mergeSettings(defaultPOSSettings, JSON.parse(raw)) : defaultPOSSettings;
  } catch {
    return defaultPOSSettings;
  }
}

function writeLocalSettings(settings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function usePOSSettings() {
  const { isOnline } = useOffline();
  const [settings, setSettings] = useState(defaultPOSSettings);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      const localSettings = readLocalSettings();

      if (active) {
        setSettings(localSettings);
      }

      if (!isOnline) {
        return;
      }

      try {
        const response = await fetch("/api/pos/settings", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const serverSettings = mergeSettings(localSettings, payload.data || payload);
        writeLocalSettings(serverSettings);

        if (active) {
          setSettings(serverSettings);
        }
      } catch {
        // Local settings remain the source of truth when the backend is unavailable.
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [isOnline]);

  const updateSettings = useCallback(
    async (section, values) => {
      const nextSettings = mergeSettings(settings, {
        [section]: {
          ...(settings[section] || {}),
          ...values,
        },
      });

      setSettings(nextSettings);
      writeLocalSettings(nextSettings);

      if (isOnline) {
        try {
          await fetch("/api/pos/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nextSettings),
          });
        } catch {
          // Failed remote sync should not block local POS settings.
        }
      }

      return nextSettings;
    },
    [isOnline, settings],
  );

  const getSetting = useCallback(
    (key) => key.split(".").reduce((value, segment) => value?.[segment], settings),
    [settings],
  );

  return { settings, updateSettings, getSetting };
}
