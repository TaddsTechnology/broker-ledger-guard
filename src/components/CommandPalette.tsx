import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Home,
  Users,
  Building2,
  Calendar,
  TrendingUp,
  FileText,
  Receipt,
  BarChart3,
  BookOpen,
  Plus,
  Search,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddParty?: () => void;
}

export const CommandPalette = ({
  open,
  onOpenChange,
  onAddParty,
}: CommandPaletteProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const commands = [
    {
      group: "Navigation",
      items: [
        {
          icon: Home,
          label: "Dashboard",
          shortcut: "Alt+H",
          action: () => navigate("/dashboard"),
        },
        {
          icon: Users,
          label: "Party Master",
          shortcut: "Alt+1",
          action: () => navigate("/master/party"),
        },
        {
          icon: Building2,
          label: "Company Master",
          shortcut: "Alt+2",
          action: () => navigate("/master/company"),
        },
        {
          icon: Calendar,
          label: "Settlement Master",
          shortcut: "Alt+3",
          action: () => navigate("/master/settlement"),
        },
        {
          icon: TrendingUp,
          label: "Trade File Transfer",
          shortcut: "Alt+4",
          action: () => navigate("/trading"),
        },
        {
          icon: FileText,
          label: "Contracts",
          shortcut: "Alt+5",
          action: () => navigate("/contracts"),
        },
        {
          icon: Receipt,
          label: "Bills",
          shortcut: "Alt+6",
          action: () => navigate("/bills"),
        },
        {
          icon: BarChart3,
          label: "Reports",
          shortcut: "Alt+7",
          action: () => navigate("/reports"),
        },
        {
          icon: BookOpen,
          label: "Ledger",
          shortcut: "Alt+8",
          action: () => navigate("/ledger"),
        },
      ],
    },
    {
      group: "Actions",
      items: [
        {
          icon: Plus,
          label: "Add New Party",
          shortcut: "Alt+N",
          action: () => {
            navigate("/master/party");
            onAddParty?.();
          },
        },
      ],
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {commands.map((group) => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map((item) => (
              <CommandItem
                key={item.label}
                onSelect={() => {
                  item.action();
                  onOpenChange(false);
                }}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.shortcut && (
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    {item.shortcut}
                  </kbd>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
