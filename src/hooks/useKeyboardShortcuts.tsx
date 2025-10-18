import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
  category?: string;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      const isContentEditable = target.isContentEditable;

      if (isInput || isContentEditable) {
        // Allow Escape and some special keys even in inputs
        if (event.key !== "Escape" && !(event.ctrlKey && event.key === "k")) {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : true;
        const altMatch = shortcut.alt ? event.altKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : true;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (
          keyMatch &&
          ctrlMatch &&
          altMatch &&
          shiftMatch &&
          event.ctrlKey === !!shortcut.ctrl &&
          event.altKey === !!shortcut.alt &&
          event.shiftKey === !!shortcut.shift
        ) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);
};

export const useGlobalShortcuts = (
  onCommandPalette: () => void,
  onHelp: () => void
) => {
  const navigate = useNavigate();

  const shortcuts: ShortcutConfig[] = [
    {
      key: "k",
      ctrl: true,
      action: onCommandPalette,
      description: "Open command palette",
      category: "General",
    },
    {
      key: "?",
      shift: true,
      action: onHelp,
      description: "Show keyboard shortcuts",
      category: "General",
    },
    {
      key: "h",
      alt: true,
      action: () => navigate("/dashboard"),
      description: "Go to Dashboard",
      category: "Navigation",
    },
    {
      key: "1",
      alt: true,
      action: () => navigate("/master/party"),
      description: "Go to Party Master",
      category: "Navigation",
    },
    {
      key: "2",
      alt: true,
      action: () => navigate("/master/company"),
      description: "Go to Company Master",
      category: "Navigation",
    },
    {
      key: "3",
      alt: true,
      action: () => navigate("/master/settlement"),
      description: "Go to Settlement Master",
      category: "Navigation",
    },
    {
      key: "4",
      alt: true,
      action: () => navigate("/trading"),
      description: "Go to Trading",
      category: "Navigation",
    },
    {
      key: "5",
      alt: true,
      action: () => navigate("/contracts"),
      description: "Go to Contracts",
      category: "Navigation",
    },
    {
      key: "6",
      alt: true,
      action: () => navigate("/bills"),
      description: "Go to Bills",
      category: "Navigation",
    },
    {
      key: "7",
      alt: true,
      action: () => navigate("/reports"),
      description: "Go to Reports",
      category: "Navigation",
    },
    {
      key: "8",
      alt: true,
      action: () => navigate("/ledger"),
      description: "Go to Ledger",
      category: "Navigation",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
};
