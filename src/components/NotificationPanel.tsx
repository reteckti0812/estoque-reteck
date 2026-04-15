import React from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ open, onClose }) => {
  const { notifications, markNotificationRead } = useInventory();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute right-4 top-16 w-80 bg-card border rounded-xl shadow-lg animate-slide-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-foreground">Notificações</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="max-h-80 overflow-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma notificação</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`p-3 border-b last:border-0 ${!n.read ? "bg-accent/50" : ""}`}>
                <p className="text-sm text-foreground">{n.message}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.timestamp).toLocaleString("pt-BR")}
                  </span>
                  {!n.read && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => markNotificationRead(n.id)}>
                      <Check className="w-3 h-3 mr-1" /> Lida
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
