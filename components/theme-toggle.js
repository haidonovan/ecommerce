"use client";

import { Check, MoonStar, Sparkles, SunMedium } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { appThemes } from "@/lib/site";

const THEME_STORAGE_KEY = "grocery-theme";
const MODE_STORAGE_KEY = "grocery-mode";
const THEME_EVENT = "grocery-theme-change";
const THEME_BLAST_EVENT = "grocery-theme-blast";
const SERVER_SNAPSHOT = "classic::light";

function getStoredTheme() {
  if (typeof window === "undefined") {
    return "classic";
  }

  return localStorage.getItem(THEME_STORAGE_KEY) || "classic";
}

function getStoredMode() {
  if (typeof window === "undefined") {
    return "light";
  }

  return localStorage.getItem(MODE_STORAGE_KEY) || "light";
}

function getSnapshot() {
  return `${getStoredTheme()}::${getStoredMode()}`;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function subscribe(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener(THEME_EVENT, handleChange);
  mediaQuery.addEventListener("change", handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(THEME_EVENT, handleChange);
    mediaQuery.removeEventListener("change", handleChange);
  };
}

function applyTheme(theme, mode) {
  const body = document.body;
  const resolvedMode =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;

  Object.values(appThemes).forEach(({ bodyClassName }) => body.classList.remove(bodyClassName));
  body.classList.add(appThemes[theme].bodyClassName);
  body.dataset.mode = resolvedMode;
}

export function ThemeToggle() {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [theme, mode] = snapshot.split("::");

  useEffect(() => {
    applyTheme(theme, mode);
  }, [theme, mode]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleThemeChange(nextTheme) {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  function handleModeChange(nextMode) {
    localStorage.setItem(MODE_STORAGE_KEY, nextMode);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  function triggerBlast() {
    const rect = rootRef.current?.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent(THEME_BLAST_EVENT, {
        detail: {
          x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
          y: rect ? rect.top + rect.height / 2 : 48,
        },
      }),
    );
  }

  function choose(action) {
    triggerBlast();
    action();
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="app-theme-trigger"
        aria-label="Theme"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {mode === "dark" ? <MoonStar className="size-4" /> : null}
        {mode === "light" ? <SunMedium className="size-4" /> : null}
        {mode === "system" ? <Sparkles className="size-4" /> : null}
        <span className="app-theme-trigger-badge">{appThemes[theme].badge}</span>
      </button>

      {open ? (
        <div className="app-theme-menu app-card" role="menu">
          <p className="app-theme-menu-section">Mode</p>
          <button
            type="button"
            onClick={() => choose(() => handleModeChange("system"))}
            className="app-theme-menu-item"
            data-active={mode === "system"}
            role="menuitemradio"
            aria-checked={mode === "system"}
          >
            <span>System</span>
            {mode === "system" ? <Check className="size-4" /> : null}
          </button>
          <button
            type="button"
            onClick={() => choose(() => handleModeChange("light"))}
            className="app-theme-menu-item"
            data-active={mode === "light"}
            role="menuitemradio"
            aria-checked={mode === "light"}
          >
            <span>Light</span>
            {mode === "light" ? <Check className="size-4" /> : null}
          </button>
          <button
            type="button"
            onClick={() => choose(() => handleModeChange("dark"))}
            className="app-theme-menu-item"
            data-active={mode === "dark"}
            role="menuitemradio"
            aria-checked={mode === "dark"}
          >
            <span>Dark</span>
            {mode === "dark" ? <Check className="size-4" /> : null}
          </button>

          <div className="my-1 h-px bg-[var(--border-soft)]" />

          <p className="app-theme-menu-section">Style</p>
          {Object.entries(appThemes).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => choose(() => handleThemeChange(key))}
              className="app-theme-menu-item"
              data-active={theme === key}
              role="menuitemradio"
              aria-checked={theme === key}
            >
              <span>{value.label}</span>
              {theme === key ? <Check className="size-4" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
