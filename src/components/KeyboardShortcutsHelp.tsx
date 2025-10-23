import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsHelp = ({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) => {
  const shortcuts = [
    {
      category: "General",
      items: [
        { keys: ["Ctrl", "K"], description: "Open command palette" },
        { keys: ["?"], description: "Show this help" },
        { keys: ["Esc"], description: "Close dialogs/modals" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["Alt", "H"], description: "Dashboard" },
        { keys: ["Alt", "1"], description: "Party Master" },
        { keys: ["Alt", "2"], description: "Company Master" },
        { keys: ["Alt", "3"], description: "Settlement Master" },
        { keys: ["Alt", "4"], description: "Trading" },
        { keys: ["Alt", "5"], description: "Contracts" },
        { keys: ["Alt", "6"], description: "Bills" },
        { keys: ["Alt", "7"], description: "Reports" },
        { keys: ["Alt", "8"], description: "Ledger" },
      ],
    },
    {
      category: "Forms & Tables",
      items: [
        { keys: ["Alt", "N"], description: "Add new party" },
        { keys: ["Tab"], description: "Navigate between fields" },
        { keys: ["Enter"], description: "Submit form / Select item" },
        { keys: ["Esc"], description: "Cancel / Close" },
        { keys: ["↑", "↓"], description: "Navigate table rows" },
        { keys: ["Home", "End"], description: "First / Last table row" },
        { keys: ["PgUp", "PgDn"], description: "Jump 10 rows up / down" },
        { keys: ["E"], description: "Edit selected row" },
        { keys: ["Del"], description: "Delete selected row" },
      ],
    },
    {
      category: "Sidebar",
      items: [
        { keys: ["Ctrl", "B"], description: "Toggle sidebar" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Navigate and control the application with your keyboard
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{item.description}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-secondary px-2 font-mono text-xs font-semibold"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary font-mono text-xs">?</kbd> anytime to see this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
