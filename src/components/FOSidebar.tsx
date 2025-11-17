import React, { useState, useRef, useEffect } from "react";
import { 
  Users, 
  Building2, 
  Calendar, 
  LineChart, 
  FileText, 
  Receipt, 
  BarChart3, 
  BookOpen,
  LogOut,
  ChevronDown,
  ChevronRight,
  Home,
  Database,
  Settings,
  Activity,
  DollarSign,
  FileSpreadsheet,
  Package,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Upload,
  FileSpreadsheet as ContractIcon
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  url?: string;
  submenu?: { title: string; url: string; icon?: React.ComponentType<{ className?: string }> }[];
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: Home,
    url: "/fo/dashboard"
  },
  {
    title: "Masters",
    icon: Database,
    submenu: [
      { title: "Parties", url: "/fo/master/party", icon: Users },
      { title: "Brokers", url: "/fo/master/broker", icon: DollarSign },
      { title: "Instruments", url: "/fo/master/instruments", icon: Building2 },
    ]
  },
  {
    title: "Trade File",
    icon: Upload,
    url: "/fo/trading"
  },
  {
    title: "Contracts",
    icon: ContractIcon,
    url: "/fo/contracts"
  },
  {
    title: "Positions",
    icon: Package,
    url: "/fo/positions"
  },
  {
    title: "Bills",
    icon: Receipt,
    submenu: [
      { title: "Party Bills", url: "/fo/bills?type=party", icon: Users },
      { title: "Broker Bills", url: "/fo/bills?type=broker", icon: DollarSign },
    ]
  },
  {
    title: "Ledger",
    icon: BookOpen,
    submenu: [
      { title: "Transactions", url: "/fo/ledger", icon: BookOpen },
      { title: "Bills", url: "/fo/ledger/bills", icon: Receipt },
    ]
  },
];

export function FOSidebar({ onLogout }: { onLogout: () => void }) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [shouldShowExpanded, setShouldShowExpanded] = useState(false);

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-primary text-primary-foreground font-medium"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  const toggleMenu = (menuTitle: string) => {
    setOpenMenus(prev => 
      prev.includes(menuTitle) 
        ? prev.filter(item => item !== menuTitle)
        : [...prev, menuTitle]
    );
  };

  const isMenuOpen = (menuTitle: string) => openMenus.includes(menuTitle) || shouldShowExpanded;

  const isSubmenuActive = (submenu: { title: string; url: string; icon?: React.ComponentType<{ className?: string }> }[]) => {
    return submenu.some(item => location.pathname === item.url);
  };

  const handleMouseEnter = () => {
    if (isCollapsed) {
      setIsHovering(true);
      setShouldShowExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTimeout(() => {
      if (!isHovering) {
        setShouldShowExpanded(false);
      }
    }, 300);
  };

  // Auto-expand menus that contain the active route
  useEffect(() => {
    menuItems.forEach(menu => {
      if (menu.submenu && isSubmenuActive(menu.submenu) && !isMenuOpen(menu.title)) {
        setOpenMenus(prev => [...prev, menu.title]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <Sidebar 
      collapsible="icon" 
      className="sidebar-clean"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeader className="header-clean">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            {(!isCollapsed || shouldShowExpanded) && (
              <div className="flex flex-col animate-in fade-in-0 slide-in-from-left-2">
                <span className="font-bold text-sm text-clean">Broker ERP</span>
                <span className="text-xs text-muted-clean">F&O System</span>
              </div>
            )}
          </div>
          {(!isCollapsed || shouldShowExpanded) && (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-2 py-1.5 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">F&O Module</span>
                  </div>
                  <button 
                    onClick={() => navigate('/modules')}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                    title="Switch Module"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu className="gap-1">
          {menuItems.map((menu) => {
            const MenuIcon = menu.icon;
            const hasSubmenu = menu.submenu && menu.submenu.length > 0;
            const isOpen = isMenuOpen(menu.title);
            const hasActiveSubmenu = hasSubmenu && isSubmenuActive(menu.submenu!);
            const showText = !isCollapsed || shouldShowExpanded;

            return (
              <SidebarMenuItem key={menu.title}>
                {hasSubmenu ? (
                  <Collapsible open={isOpen} onOpenChange={(open) => {
                    setOpenMenus((prev) => {
                      if (open) {
                        return prev.includes(menu.title) ? prev : [...prev, menu.title];
                      }
                      return prev.filter((t) => t !== menu.title);
                    });
                  }}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={`w-full justify-between ${
                          hasActiveSubmenu 
                            ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium" 
                            : "text-sidebar-foreground font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MenuIcon className="w-4 h-4 shrink-0" />
                          {showText && (
                            <span className="font-medium animate-in fade-in-0 slide-in-from-left-1">
                              {menu.title}
                            </span>
                          )}
                        </div>
                        {showText && (
                          <ChevronDown 
                            className={`w-4 h-4 transition-transform animate-in fade-in-0 ${
                              isOpen ? "transform rotate-180" : ""
                            }`} 
                          />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden transition-all duration-200">
                      {showText && isOpen && (
                        <div className="ml-6 mt-1 space-y-1 animate-in fade-in-0 slide-in-from-top-1">
                          {menu.submenu!.map((submenuItem) => {
                            const SubmenuIcon = submenuItem.icon;
                            return (
                              <SidebarMenuButton key={submenuItem.title} asChild size="sm">
                                <NavLink
                                  to={submenuItem.url}
                                  className={({ isActive }) =>
                                    `transition-colors ${
                                      isActive
                                        ? "bg-purple-600 text-white font-medium"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    }`
                                  }
                                >
                                  {SubmenuIcon && <SubmenuIcon className="w-3 h-3 mr-2" />}
                                  <span className="text-sm">{submenuItem.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            );
                          })}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <SidebarMenuButton asChild>
                    <NavLink to={menu.url!} className={getNavClassName}>
                      <MenuIcon className="w-4 h-4 shrink-0" />
                      {showText && (
                        <span className="font-medium animate-in fade-in-0 slide-in-from-left-1">
                          {menu.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="footer-clean">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2 shrink-0" />
          {(!isCollapsed || shouldShowExpanded) && (
            <span className="animate-in fade-in-0 slide-in-from-left-1">Logout</span>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
