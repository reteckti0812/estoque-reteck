import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Lot, LotItem, ProductModel, DefectType, AuditLog, Notification, PalletCell,
  mockLots, mockProductModels, mockDefectTypes, mockAuditLogs, mockNotifications, mockPalletMap,
} from "@/data/mockData";
import { useAuth } from "./AuthContext";

interface InventoryContextType {
  lots: Lot[];
  productModels: ProductModel[];
  defectTypes: DefectType[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  palletMap: PalletCell[];
  createLot: (lot: Omit<Lot, "id" | "items" | "status" | "createdAt" | "createdBy">) => Promise<Lot>;
  addItemToLot: (lotId: string, item: Omit<LotItem, "id" | "createdAt" | "createdBy">) => Promise<LotItem>;
  pauseLot: (lotId: string) => Promise<void>;
  resumeLot: (lotId: string) => Promise<void>;
  finishLot: (lotId: string, address: string) => Promise<void>;
  placePallet: (street: string, column: number, level: number, lotId: string) => Promise<void>;
  addProductModel: (model: Omit<ProductModel, "id">) => Promise<void>;
  addDefectType: (defect: Omit<DefectType, "id">) => Promise<void>;
  deleteProductModel: (id: string) => Promise<void>;
  deleteDefectType: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  unreadCount: number;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [lots, setLots] = useState<Lot[]>(mockLots);
  const [productModels, setProductModels] = useState<ProductModel[]>(mockProductModels);
  const [defectTypes, setDefectTypes] = useState<DefectType[]>(mockDefectTypes);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [palletMap, setPalletMap] = useState<PalletCell[]>(mockPalletMap);

  const addLog = useCallback((action: string, details: string) => {
    const log: AuditLog = {
      id: `a${Date.now()}`,
      userId: user?.id || "",
      userName: user?.name || "",
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);
  }, [user]);

  const addNotif = useCallback((message: string) => {
    setNotifications((prev) => [
      { id: `n${Date.now()}`, message, timestamp: new Date().toISOString(), read: false },
      ...prev,
    ]);
  }, []);

  const createLot = useCallback(async (data: Omit<Lot, "id" | "items" | "status" | "createdAt" | "createdBy">) => {
    const lot: Lot = {
      ...data,
      id: `l${Date.now()}`,
      items: [],
      status: "active",
      createdAt: new Date().toISOString(),
      createdBy: user?.id || "",
    };
    setLots((prev) => [lot, ...prev]);
    addLog("LOT_CREATED", `Lote ${data.name} criado`);
    addNotif(`Novo lote "${data.name}" criado por ${user?.name}`);
    return lot;
  }, [user, addLog, addNotif]);

  const addItemToLot = useCallback(async (lotId: string, itemData: Omit<LotItem, "id" | "createdAt" | "createdBy">) => {
    const item: LotItem = {
      ...itemData,
      id: `li${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: user?.id || "",
    };
    setLots((prev) => prev.map((l) => l.id === lotId ? { ...l, items: [...l.items, item] } : l));
    addLog("ITEM_ADDED", `${itemData.productName} adicionado ao lote ${lotId}`);
    return item;
  }, [user, addLog]);

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

  const placePallet = useCallback(async (street: string, column: number, level: number, lotId: string) => {
    const lot = lots.find((l) => l.id === lotId);
    setPalletMap((prev) => [...prev, { street, column, level, lotId, lotName: lot?.name }]);
  }, [lots]);

  const addProductModel = useCallback(async (model: Omit<ProductModel, "id">) => {
    setProductModels((prev) => [...prev, { ...model, id: `pm${Date.now()}` }]);
    addLog("PRODUCT_MODEL_ADDED", `Modelo ${model.name} cadastrado`);
  }, [addLog]);

  const addDefectType = useCallback(async (defect: Omit<DefectType, "id">) => {
    setDefectTypes((prev) => [...prev, { ...defect, id: `d${Date.now()}` }]);
    addLog("DEFECT_TYPE_ADDED", `Defeito ${defect.name} cadastrado`);
  }, [addLog]);

  const deleteProductModel = useCallback(async (id: string) => {
    setProductModels((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const deleteDefectType = useCallback(async (id: string) => {
    setDefectTypes((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <InventoryContext.Provider
      value={{
        lots, productModels, defectTypes, auditLogs, notifications, palletMap,
        createLot, addItemToLot, pauseLot, resumeLot, finishLot, placePallet,
        addProductModel, addDefectType, deleteProductModel, deleteDefectType,
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
