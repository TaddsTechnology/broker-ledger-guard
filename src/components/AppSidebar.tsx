import React, { useState, useRef, useEffect } from "react";
import { 
  Users, 
  Building2, 
  Calendar, 
  TrendingUp, 
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
  ArrowLeftRight
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
  submenu?: { title: string; url: string; icon?: React.ComponentType<{ className?: string }>; submenu?: { title: string; url: string; icon?: React.ComponentType<{ className?: string }> }[] }[];
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: Home,
    url: "/equity/dashboard"
  },
  {
    title: "Masters",
    icon: Database,
    submenu: [
      { title: "Parties", url: "/equity/master/party", icon: Users },
      { title: "Brokers", url: "/equity/master/broker", icon: DollarSign },
      { title: "Companies", url: "/equity/master/company", icon: Building2 },
      { title: "Settlements", url: "/equity/master/settlement", icon: Calendar },
    ]
  },
  {
    title: "Trading",
    icon: TrendingUp,
    submenu: [
      { title: "Upload Trades", url: "/equity/trading", icon: TrendingUp },
      { title: "Contracts", url: "/equity/contracts", icon: FileText },
      { title: "Holdings", url: "/equity/holdings", icon: Package },
    ]
  },
  {
    title: "Billing",
    icon: Receipt,
    submenu: [
      { title: "Party Bills", url: "/equity/bills?type=party", icon: Users },
      { title: "Broker Bills", url: "/equity/bills?type=broker", icon: DollarSign },
    ]
  },
  {
    title: "Ledger",
    icon: BookOpen,
    submenu: [
      { title: "Transactions", url: "/equity/ledger", icon: BookOpen },
      { title: "Bills", url: "/equity/ledger/bills", icon: Receipt },
      { title: "Interest", url: "/equity/interest", icon: TrendingUp },
    ]
  },
  {
    title: "Cash",
    icon: DollarSign,
    url: "/equity/cash",
  },
  {
    title: "Summary",
    icon: BarChart3,
    url: "/equity/summary",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
  // {
  //   title: "Reports & Analytics",
  //   icon: FileSpreadsheet,
  //   submenu: [
  //     { title: "Business Reports", url: "/reports", icon: BarChart3 },
  //     { title: "Party Statements", url: "/reports/party", icon: Users },
  //     { title: "Trading Summary", url: "/reports/trading", icon: TrendingUp },
  //   ]
  // },
  // {
  //   title: "System Settings",
  //   icon: Settings,
  //   submenu: [
  //     { title: "Application Settings", url: "/settings", icon: Settings },
  //     { title: "Data Management", url: "/settings/data", icon: Database },
  //   ]
  // }
];

export function AppSidebar({ onLogout }: { onLogout: () => void }) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [shouldShowExpanded, setShouldShowExpanded] = useState(false);
  
  // Create a flattened array of all focusable items for tab navigation
  const getFlatMenuItems = () => {
    const items: Array<{type: 'menu' | 'submenu', title: string, url?: string, parentTitle?: string, tabIndex: number}> = [];
    let tabIndex = 1;
    
    menuItems.forEach((menu) => {
      // Add main menu item
      items.push({
        type: 'menu',
        title: menu.title,
        url: menu.url,
        tabIndex: tabIndex++
      });
      
      // Add submenu items if menu is open
      if (menu.submenu && (openMenus.includes(menu.title) || shouldShowExpanded)) {
        menu.submenu.forEach((submenu) => {
          items.push({
            type: 'submenu',
            title: submenu.title,
            url: submenu.url,
            parentTitle: menu.title,
            tabIndex: tabIndex++
          });
        });
      }
    });
    
    // Add logout button
    items.push({
      type: 'menu',
      title: 'Logout',
      tabIndex: tabIndex++
    });
    
    return items;
  };

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

  // Handle Enter key on menu items
  const handleMenuEnter = (menu: MenuItem) => {
    if (menu.submenu) {
      // If it has submenu, toggle it open
      toggleMenu(menu.title);
    } else if (menu.url) {
      // If it's a direct link, navigate
      navigate(menu.url);
    }
  };

  // Handle Enter key on submenu items  
  const handleSubmenuEnter = (submenuItem: { title: string; url: string; icon?: React.ComponentType<{ className?: string }> }) => {
    // For master pages, add action=new to auto-open form
    const masterPages = ['/equity/master/party', '/equity/master/company', '/equity/master/settlement'];
    if (masterPages.includes(submenuItem.url)) {
      navigate(`${submenuItem.url}?action=new`);
    } else {
      navigate(submenuItem.url);
    }
  };

  // Handle hover expand/collapse
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
    }, 300); // Delay to prevent flickering
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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            {(!isCollapsed || shouldShowExpanded) && (
              <div className="flex flex-col animate-in fade-in-0 slide-in-from-left-2">
                <span className="font-bold text-sm text-clean">Broker ERP</span>
                <span className="text-xs text-muted-clean">Trading System</span>
              </div>
            )}
          </div>
          {(!isCollapsed || shouldShowExpanded) && (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-2 py-1.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Equity Module</span>
                  </div>
                  <button 
                    onClick={() => navigate('/modules')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
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
          {menuItems.map((menu, menuIndex) => {
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
                        className={`w-full justify-between focus:ring-2 focus:ring-primary/50 ${
                          hasActiveSubmenu 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-sidebar-foreground font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleMenuEnter(menu);
                          }
                        }}
                        onClick={() => {
                          // If collapsed, temporarily show expanded sidebar so submenu becomes visible
                          if (isCollapsed && !shouldShowExpanded) {
                            setShouldShowExpanded(true);
                          }
                          // Do not toggle here; CollapsibleTrigger handles it via onOpenChange
                        }}
                        onDoubleClick={() => {
                          // Navigate to first submenu item on double-click
                          if (menu.submenu && menu.submenu.length > 0) {
                            const first = menu.submenu[0];
                            if (first?.url) {
                              navigate(first.url);
                            }
                          }
                        }}
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
                          {menu.submenu!.map((submenuItem, submenuIndex) => {
                            const SubmenuIcon = submenuItem.icon;
                            
                            // Check if this submenu item has its own submenu
                            const hasNestedSubmenu = submenuItem.submenu && submenuItem.submenu.length > 0;
                            const isNestedSubmenuOpen = openMenus.includes(submenuItem.title) || shouldShowExpanded;
                            
                            if (hasNestedSubmenu) {
                              return (
                                <Collapsible 
                                  key={submenuItem.title} 
                                  open={isNestedSubmenuOpen} 
                                  onOpenChange={(open) => {
                                    setOpenMenus((prev) => {
                                      if (open) {
                                        return prev.includes(submenuItem.title) ? prev : [...prev, submenuItem.title];
                                      }
                                      return prev.filter((t) => t !== submenuItem.title);
                                    });
                                  }}
                                >
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                      className="w-full justify-between focus:ring-2 focus:ring-primary/50 text-sidebar-foreground font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground pl-2"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault();
                                          if (submenuItem.url) {
                                            navigate(submenuItem.url);
                                          } else {
                                            // Toggle submenu
                                            setOpenMenus(prev => 
                                              prev.includes(submenuItem.title) 
                                                ? prev.filter(item => item !== submenuItem.title)
                                                : [...prev, submenuItem.title]
                                            );
                                          }
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        {SubmenuIcon && <SubmenuIcon className="w-3 h-3 mr-2" />}
                                        <span className="text-sm">{submenuItem.title}</span>
                                      </div>
                                      <ChevronDown 
                                        className={`w-3 h-3 transition-transform ${
                                          isNestedSubmenuOpen ? "transform rotate-180" : ""
                                        }`} 
                                      />
                                    </SidebarMenuButton>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="overflow-hidden transition-all duration-200">
                                    {isNestedSubmenuOpen && (
                                      <div className="ml-4 mt-1 space-y-1">
                                        {submenuItem.submenu!.map((nestedItem, nestedIndex) => {
                                          const NestedIcon = nestedItem.icon;
                                          return (
                                            <SidebarMenuButton key={nestedItem.title} asChild size="sm">
                                              <NavLink
                                                to={nestedItem.url}
                                                className={({ isActive }) =>
                                                  `focus:ring-2 focus:ring-primary/50 transition-colors ${
                                                    isActive
                                                      ? "bg-primary text-primary-foreground font-medium pl-2"
                                                      : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground pl-2"
                                                  }`
                                                }
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleSubmenuEnter(nestedItem);
                                                  }
                                                }}
                                              >
                                                {NestedIcon && <NestedIcon className="w-3 h-3 mr-2" />}
                                                <span className="text-sm font-medium">{nestedItem.title}</span>
                                              </NavLink>
                                            </SidebarMenuButton>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </CollapsibleContent>
                                </Collapsible>
                              );
                            }
                            
                            return (
                              <SidebarMenuButton key={submenuItem.title} asChild size="sm">
                                <NavLink
                                  to={submenuItem.url}
                                  className={({ isActive }) =>
                                    `focus:ring-2 focus:ring-primary/50 transition-colors ${
                                      isActive
                                        ? "bg-primary text-primary-foreground font-medium pl-2"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground pl-2"
                                    }`
                                  }
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      handleSubmenuEnter(submenuItem);
                                    }
                                  }}
                                  onClick={(e) => {
                                    // For master pages, navigate with action=new
                                    const masterPages = ['/master/party', '/master/company', '/master/settlement'];
                                    if (masterPages.includes(submenuItem.url)) {
                                      e.preventDefault();
                                      navigate(`${submenuItem.url}?action=new`);
                                    }
                                  }}
                                >
                                  {SubmenuIcon && <SubmenuIcon className="w-3 h-3 mr-2" />}
                                  <span className="text-sm font-medium">{submenuItem.title}</span>
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
                    <NavLink 
                      to={menu.url!} 
                      className={({ isActive }) => 
                        `focus:ring-2 focus:ring-primary/50 ${
                          isActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`
                      }
                      tabIndex={0}
                    >
                      <MenuIcon className="w-4 h-4" />
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

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 focus:ring-2 focus:ring-destructive/50"
          tabIndex={0}
        >
          <LogOut className="w-4 h-4" />
          {(!isCollapsed || shouldShowExpanded) && (
            <span className="animate-in fade-in-0 slide-in-from-left-1">Logout</span>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
