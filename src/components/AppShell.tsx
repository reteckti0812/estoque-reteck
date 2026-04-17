import React, { useState } from "react";
import { Bell, LogOut, Menu, Package, Map, Settings, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useInventory } from "@/contexts/InventoryContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import logoGlobo from "@/assets/logo-globo.png";

interface AppShellProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onToggleNotifications: () => void;
}

const navItems = [
  { id: "lots", label: "Lotes", icon: Package, adminOnly: false },
  { id: "map", label: "Mapa", icon: Map, adminOnly: false },
  { id: "admin", label: "Admin", icon: Settings, adminOnly: true },
];

const AppShell: React.FC<AppShellProps> = ({ children, currentPage, onNavigate, onToggleNotifications }) => {
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount } = useInventory();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter((n) => !n.adminOnly || isAdmin);

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center gap-2">
            <img src={logoGlobo} alt="Re-Teck" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-foreground">Re-Teck</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">{user?.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-foreground">
              {navItems.find((n) => n.id === currentPage)?.label || ""}
            </h1>
          </div>
          {/* Notifications: only admin */}
          {isAdmin ? (
            <button className="relative p-2 rounded-lg hover:bg-accent transition-colors" onClick={onToggleNotifications}>
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </button>
          ) : <div />}
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
