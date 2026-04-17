import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Lot, LotItem, ProductModel, DefectType, AuditLog, Notification, PalletCell,
  User, LegendEntry, ACTION_LABELS,
  mockLots, mockProductModels, mockDefectTypes, mockAuditLogs, mockNotifications, mockPalletMap,
  mockUsers, mockLegends,
} from "@/data/mockData";
import { useAuth } from "./AuthContext";

interface InventoryContextType {
  lots: Lot[];
  productModels: ProductModel[];
  defectTypes: DefectType[];
  users: User[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  palletMap: PalletCell[];
  legends: LegendEntry[];
  // Lots
  createLot: (data: { name: string; isB2B: boolean; observation: string }) => Promise<Lot>;
  addItemToLot: (lotId: string, item: Omit<LotItem, "id" | "createdAt" | "createdBy">) => Promise<LotItem>;
  deleteLastItem: (lotId: string) => Promise<void>;
  deleteItem: (lotId: string, itemId: string) => Promise<void>;
  pauseLot: (lotId: string) => Promise<void>;
  resumeLot: (lotId: string) => Promise<void>;
  finishLot: (lotId: string, address: string) => Promise<void>;
  finishLotWithoutLocation: (lotId: string) => Promise<void>;
  placePallet: (street: string, column: number, level: number, lotId: string) => Promise<void>;
  // Products
  addProductModel: (model: Omit<ProductModel, "id">) => Promise<void>;
  updateProductModel: (id: string, data: Partial<ProductModel>) => Promise<void>;
  deleteProductModel: (id: string) => Promise<void>;
  // Defects
  addDefectType: (defect: Omit<DefectType, "id">) => Promise<void>;
  updateDefectType: (id: string, data: Partial<DefectType>) => Promise<void>;
  deleteDefectType: (id: string) => Promise<void>;
  // Users
  addUser: (u: Omit<User, "id" | "createdAt">) => Promise<string>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<{ blocked: boolean; reason?: string }>;
  // Legends
  addLegend: (l: Omit<LegendEntry, "id">) => Promise<void>;
  updateLegend: (id: string, data: Partial<LegendEntry>) => Promise<void>;
  deleteLegend: (id: string) => Promise<void>;
  // Notifications
  markNotificationRead: (id: string) => void;
  unreadCount: number;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [lots, setLots] = useState<Lot[]>(mockLots);
  const [productModels, setProductModels] = useState<ProductModel[]>(mockProductModels);
  const [defectTypes, setDefectTypes] = useState<DefectType[]>(mockDefectTypes);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [palletMap, setPalletMap] = useState<PalletCell[]>(mockPalletMap);
  const [legends, setLegends] = useState<LegendEntry[]>(mockLegends);

  const addLog = useCallback((action: string, details: string, oldData?: string, newData?: string) => {
    const log: AuditLog = {
      id: `a${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
      userId: user?.id || "",
      userName: user?.name || "",
      action,
      actionLabel: ACTION_LABELS[action] || action,
      details,
      timestamp: new Date().toISOString(),
      oldData,
      newData,
    };
    setAuditLogs((prev) => [log, ...prev]);
  }, [user]);

  const addNotif = useCallback((message: string) => {
    setNotifications((prev) => [
      { id: `n${Date.now()}`, message, timestamp: new Date().toISOString(), read: false },
      ...prev,
    ]);
  }, []);

  // === Lot operations ===
  const createLot = useCallback(async (data: { name: string; isB2B: boolean; observation: string }) => {
    const lot: Lot = {
      id: `l${Date.now()}`,
      name: data.name,
      isB2B: data.isB2B,
      observation: data.observation,
      items: [],
      status: "active",
      createdAt: new Date().toISOString(),
      createdBy: user?.id || "",
    };
    setLots((prev) => [lot, ...prev]);
    addLog("LOT_CREATED", `Lote ${data.name} criado${data.isB2B ? " (B2B)" : ""}`);
    addNotif(`Novo lote "${data.name}" criado por ${user?.name}`);
    return lot;
  }, [user, addLog, addNotif]);

  const addItemToLot = useCallback(async (lotId: string, itemData: Omit<LotItem, "id" | "createdAt" | "createdBy">) => {
    const item: LotItem = { ...itemData, id: `li${Date.now()}`, createdAt: new Date().toISOString(), createdBy: user?.id || "" };
    setLots((prev) => prev.map((l) => l.id === lotId ? { ...l, items: [...l.items, item] } : l));
    addLog("ITEM_ADDED", `${itemData.productName} adicionado ao lote`);
    return item;
  }, [user, addLog]);

  const deleteLastItem = useCallback(async (lotId: string) => {
    setLots((prev) => prev.map((l) => {
      if (l.id !== lotId || l.items.length === 0) return l;
      const last = l.items[l.items.length - 1];
      addLog("ITEM_DELETED", `Último item "${last.productName}" removido do lote ${l.name}`);
      return { ...l, items: l.items.slice(0, -1) };
    }));
  }, [addLog]);

  const deleteItem = useCallback(async (lotId: string, itemId: string) => {
    setLots((prev) => prev.map((l) => {
      if (l.id !== lotId) return l;
      const it = l.items.find((i) => i.id === itemId);
      if (it) addLog("ITEM_DELETED", `Item "${it.productName}" removido do lote ${l.name} (admin)`);
      return { ...l, items: l.items.filter((i) => i.id !== itemId) };
    }));
  }, [addLog]);

  const pauseLot = useCallback(async (lotId: string) => {
    setLots((prev) => prev.map((l) => l.id === lotId ? { ...l, status: "paused" } : l));
    const lot = lots.find((l) => l.id === lotId);
    addLog("LOT_PAUSED", `Lote ${lot?.name} pausado`);
    addNotif(`Lote "${lot?.name}" pausado por ${user?.name}`);
  }, [lots, user, addLog, addNotif]);

  const resumeLot = useCallback(async (lotId: string) => {
    setLots((prev) => prev.map((l) => l.id === lotId ? { ...l, status: "active" } : l));
    addLog("LOT_RESUMED", `Lote retomado`);
  }, [addLog]);

  const finishLot = useCallback(async (lotId: string, address: string) => {
    setLots((prev) => prev.map((l) => l.id === lotId ? { ...l, status: "finished", palletAddress: address } : l));
    const lot = lots.find((l) => l.id === lotId);
    addLog("LOT_FINISHED", `Lote ${lot?.name} finalizado - ${address}`);
    addNotif(`Lote "${lot?.name}" finalizado por ${user?.name}`);
  }, [lots, user, addLog, addNotif]);

  const finishLotWithoutLocation = useCallback(async (lotId: string) => {
    setLots((prev) => prev.map((l) => l.id === lotId ? { ...l, status: "awaiting_location" } : l));
    const lot = lots.find((l) => l.id === lotId);
    addLog("LOT_AWAITING_LOCATION", `Lote ${lot?.name} finalizado sem localização (aguardando endereçamento)`);
    addNotif(`Lote "${lot?.name}" finalizado sem localização por ${user?.name}`);
  }, [lots, user, addLog, addNotif]);

  const placePallet = useCallback(async (street: string, column: number, level: number, lotId: string) => {
    const lot = lots.find((l) => l.id === lotId);
    setPalletMap((prev) => [...prev, { street, column, level, lotId, lotName: lot?.name }]);
  }, [lots]);

  // === Product Models ===
  const addProductModel = useCallback(async (model: Omit<ProductModel, "id">) => {
    const newPm = { ...model, id: `pm${Date.now()}` };
    setProductModels((prev) => [...prev, newPm]);
    addLog("PRODUCT_MODEL_ADDED", `Modelo ${model.brand} - ${model.name} cadastrado`, undefined, JSON.stringify(newPm));
  }, [addLog]);

  const updateProductModel = useCallback(async (id: string, data: Partial<ProductModel>) => {
    setProductModels((prev) => {
      const old = prev.find((p) => p.id === id);
      addLog("PRODUCT_MODEL_UPDATED", `Modelo "${old?.brand} - ${old?.name}" atualizado`, JSON.stringify(old), JSON.stringify({ ...old, ...data }));
      return prev.map((p) => p.id === id ? { ...p, ...data } : p);
    });
  }, [addLog]);

  const deleteProductModel = useCallback(async (id: string) => {
    setProductModels((prev) => {
      const old = prev.find((p) => p.id === id);
      if (old) addLog("PRODUCT_MODEL_DELETED", `Modelo "${old.brand} - ${old.name}" removido`, JSON.stringify(old));
      return prev.filter((p) => p.id !== id);
    });
  }, [addLog]);

  // === Defect Types ===
  const addDefectType = useCallback(async (defect: Omit<DefectType, "id">) => {
    const newD = { ...defect, id: `d${Date.now()}` };
    setDefectTypes((prev) => [...prev, newD]);
    addLog("DEFECT_TYPE_ADDED", `Defeito ${defect.name} cadastrado`, undefined, JSON.stringify(newD));
  }, [addLog]);

  const updateDefectType = useCallback(async (id: string, data: Partial<DefectType>) => {
    setDefectTypes((prev) => {
      const old = prev.find((d) => d.id === id);
      addLog("DEFECT_TYPE_UPDATED", `Defeito "${old?.name}" atualizado`, JSON.stringify(old), JSON.stringify({ ...old, ...data }));
      return prev.map((d) => d.id === id ? { ...d, ...data } : d);
    });
  }, [addLog]);

  const deleteDefectType = useCallback(async (id: string) => {
    setDefectTypes((prev) => {
      const old = prev.find((d) => d.id === id);
      if (old) addLog("DEFECT_TYPE_DELETED", `Defeito "${old.name}" removido`, JSON.stringify(old));
      return prev.filter((d) => d.id !== id);
    });
  }, [addLog]);

  // === Users ===
  const addUser = useCallback(async (u: Omit<User, "id" | "createdAt">): Promise<string> => {
    const tempPass = `temp${Math.random().toString(36).slice(2, 8)}`;
    const newUser: User = { ...u, id: `u${Date.now()}`, password: u.password || tempPass, createdAt: new Date().toISOString() };
    setUsers((prev) => [...prev, newUser]);
    addLog("USER_CREATED", `Usuário "${u.name}" criado com papel ${u.role}`);
    return newUser.password;
  }, [addLog]);

  const updateUser = useCallback(async (id: string, data: Partial<User>) => {
    setUsers((prev) => {
      const old = prev.find((u) => u.id === id);
      if (data.role && old?.role !== data.role) {
        addLog("USER_ROLE_CHANGED", `Papel de "${old?.name}" alterado de ${old?.role} para ${data.role}`, JSON.stringify({ role: old?.role }), JSON.stringify({ role: data.role }));
      } else {
        addLog("USER_UPDATED", `Usuário "${old?.name}" atualizado`, JSON.stringify(old), JSON.stringify({ ...old, ...data }));
      }
      return prev.map((u) => u.id === id ? { ...u, ...data } : u);
    });
  }, [addLog]);

  const deleteUser = useCallback(async (id: string): Promise<{ blocked: boolean; reason?: string }> => {
    const target = users.find((u) => u.id === id);
    if (!target) return { blocked: true, reason: "Usuário não encontrado" };
    if (target.role === "admin") {
      const activeAdmins = users.filter((u) => u.role === "admin" && u.active);
      if (activeAdmins.length <= 1) {
        return { blocked: true, reason: "Não é possível excluir o único administrador ativo do sistema." };
      }
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addLog("USER_DELETED", `Usuário "${target.name}" excluído`, JSON.stringify(target));
    return { blocked: false };
  }, [users, addLog]);

  // === Legends ===
  const addLegend = useCallback(async (l: Omit<LegendEntry, "id">) => {
    const newL = { ...l, id: `leg${Date.now()}` };
    setLegends((prev) => [...prev, newL]);
    addLog("LEGEND_ADDED", `Legenda "${l.term}" criada`, undefined, JSON.stringify(newL));
  }, [addLog]);

  const updateLegend = useCallback(async (id: string, data: Partial<LegendEntry>) => {
    setLegends((prev) => {
      const old = prev.find((l) => l.id === id);
      addLog("LEGEND_UPDATED", `Legenda "${old?.term}" atualizada`, JSON.stringify(old), JSON.stringify({ ...old, ...data }));
      return prev.map((l) => l.id === id ? { ...l, ...data } : l);
    });
  }, [addLog]);

  const deleteLegend = useCallback(async (id: string) => {
    setLegends((prev) => {
      const old = prev.find((l) => l.id === id);
      if (old) addLog("LEGEND_DELETED", `Legenda "${old.term}" removida`, JSON.stringify(old));
      return prev.filter((l) => l.id !== id);
    });
  }, [addLog]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <InventoryContext.Provider
      value={{
        lots, productModels, defectTypes, users,
        auditLogs, notifications, palletMap, legends,
        createLot, addItemToLot, deleteLastItem, deleteItem,
        pauseLot, resumeLot, finishLot, finishLotWithoutLocation, placePallet,
        addProductModel, updateProductModel, deleteProductModel,
        addDefectType, updateDefectType, deleteDefectType,
        addUser, updateUser, deleteUser,
        addLegend, updateLegend, deleteLegend,
        markNotificationRead, unreadCount,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
};
