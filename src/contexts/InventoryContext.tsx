import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Lot, LotItem, ProductModel, DefectType, AuditLog, Notification, PalletCell,
  ProductCategory, LotCategory, Voltage, User,
  mockLots, mockProductModels, mockDefectTypes, mockAuditLogs, mockNotifications, mockPalletMap,
  mockProductCategories, mockLotCategories, mockVoltages, mockUsers,
} from "@/data/mockData";
import { useAuth } from "./AuthContext";

interface InventoryContextType {
  lots: Lot[];
  productModels: ProductModel[];
  defectTypes: DefectType[];
  productCategories: ProductCategory[];
  lotCategories: LotCategory[];
  voltages: Voltage[];
  users: User[];
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
  // Product Categories
  addProductCategory: (cat: Omit<ProductCategory, "id">) => Promise<void>;
  updateProductCategory: (id: string, data: Partial<ProductCategory>) => Promise<void>;
  toggleProductCategory: (id: string) => Promise<{ blocked: boolean; count: number }>;
  // Lot Categories
  addLotCategory: (cat: Omit<LotCategory, "id">) => Promise<void>;
  updateLotCategory: (id: string, data: Partial<LotCategory>) => Promise<void>;
  toggleLotCategory: (id: string) => Promise<{ blocked: boolean; count: number }>;
  // Voltages
  addVoltage: (v: Omit<Voltage, "id">) => Promise<void>;
  updateVoltage: (id: string, data: Partial<Voltage>) => Promise<void>;
  toggleVoltage: (id: string) => Promise<{ blocked: boolean; count: number }>;
  // Users
  addUser: (u: Omit<User, "id" | "createdAt">) => Promise<string>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  toggleUser: (id: string) => Promise<{ blocked: boolean; reason?: string }>;
  markNotificationRead: (id: string) => void;
  unreadCount: number;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [lots, setLots] = useState<Lot[]>(mockLots);
  const [productModels, setProductModels] = useState<ProductModel[]>(mockProductModels);
  const [defectTypes, setDefectTypes] = useState<DefectType[]>(mockDefectTypes);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(mockProductCategories);
  const [lotCategories, setLotCategories] = useState<LotCategory[]>(mockLotCategories);
  const [voltages, setVoltages] = useState<Voltage[]>(mockVoltages);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [palletMap, setPalletMap] = useState<PalletCell[]>(mockPalletMap);

  const addLog = useCallback((action: string, details: string, oldData?: string, newData?: string) => {
    const log: AuditLog = {
      id: `a${Date.now()}`,
      userId: user?.id || "",
      userName: user?.name || "",
      action,
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
  const createLot = useCallback(async (data: Omit<Lot, "id" | "items" | "status" | "createdAt" | "createdBy">) => {
    const lot: Lot = { ...data, id: `l${Date.now()}`, items: [], status: "active", createdAt: new Date().toISOString(), createdBy: user?.id || "" };
    setLots((prev) => [lot, ...prev]);
    addLog("LOT_CREATED", `Lote ${data.name} criado`);
    addNotif(`Novo lote "${data.name}" criado por ${user?.name}`);
    return lot;
  }, [user, addLog, addNotif]);

  const addItemToLot = useCallback(async (lotId: string, itemData: Omit<LotItem, "id" | "createdAt" | "createdBy">) => {
    const item: LotItem = { ...itemData, id: `li${Date.now()}`, createdAt: new Date().toISOString(), createdBy: user?.id || "" };
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

  // === Product Models ===
  const addProductModel = useCallback(async (model: Omit<ProductModel, "id">) => {
    setProductModels((prev) => [...prev, { ...model, id: `pm${Date.now()}` }]);
    addLog("PRODUCT_MODEL_ADDED", `Modelo ${model.name} cadastrado`);
  }, [addLog]);

  const deleteProductModel = useCallback(async (id: string) => {
    setProductModels((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // === Defect Types ===
  const addDefectType = useCallback(async (defect: Omit<DefectType, "id">) => {
    setDefectTypes((prev) => [...prev, { ...defect, id: `d${Date.now()}` }]);
    addLog("DEFECT_TYPE_ADDED", `Defeito ${defect.name} cadastrado`);
  }, [addLog]);

  const deleteDefectType = useCallback(async (id: string) => {
    setDefectTypes((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // === Product Categories ===
  const addProductCategory = useCallback(async (cat: Omit<ProductCategory, "id">) => {
    const newCat = { ...cat, id: `pc${Date.now()}` };
    setProductCategories((prev) => [...prev, newCat]);
    addLog("PRODUCT_CATEGORY_ADDED", `Categoria de produto "${cat.name}" criada`, undefined, JSON.stringify(newCat));
  }, [addLog]);

  const updateProductCategory = useCallback(async (id: string, data: Partial<ProductCategory>) => {
    setProductCategories((prev) => {
      const old = prev.find((c) => c.id === id);
      const updated = prev.map((c) => c.id === id ? { ...c, ...data } : c);
      addLog("PRODUCT_CATEGORY_UPDATED", `Categoria "${old?.name}" atualizada`, JSON.stringify(old), JSON.stringify({ ...old, ...data }));
      return updated;
    });
  }, [addLog]);

  const toggleProductCategory = useCallback(async (id: string): Promise<{ blocked: boolean; count: number }> => {
    const cat = productCategories.find((c) => c.id === id);
    if (!cat) return { blocked: true, count: 0 };
    // No dependency check for product categories in this mock — just toggle
    setProductCategories((prev) => prev.map((c) => c.id === id ? { ...c, active: !c.active } : c));
    addLog("PRODUCT_CATEGORY_TOGGLED", `Categoria "${cat.name}" ${cat.active ? "desativada" : "ativada"}`);
    return { blocked: false, count: 0 };
  }, [productCategories, addLog]);

  // === Lot Categories ===
  const addLotCategory = useCallback(async (cat: Omit<LotCategory, "id">) => {
    const newCat = { ...cat, id: `lc${Date.now()}` };
    setLotCategories((prev) => [...prev, newCat]);
    addLog("LOT_CATEGORY_ADDED", `Categoria de lote "${cat.code}" criada`, undefined, JSON.stringify(newCat));
  }, [addLog]);

  const updateLotCategory = useCallback(async (id: string, data: Partial<LotCategory>) => {
    setLotCategories((prev) => {
      const old = prev.find((c) => c.id === id);
      const updated = prev.map((c) => c.id === id ? { ...c, ...data } : c);
      addLog("LOT_CATEGORY_UPDATED", `Categoria de lote "${old?.code}" atualizada`, JSON.stringify(old), JSON.stringify({ ...old, ...data }));
      return updated;
    });
  }, [addLog]);

  const toggleLotCategory = useCallback(async (id: string): Promise<{ blocked: boolean; count: number }> => {
    const cat = lotCategories.find((c) => c.id === id);
    if (!cat) return { blocked: true, count: 0 };
    // Check if lots use this category
    const depCount = lots.filter((l) => l.category === cat.code).length;
    if (cat.active && depCount > 0) {
      // Allow but warn — caller handles confirmation
      setLotCategories((prev) => prev.map((c) => c.id === id ? { ...c, active: false } : c));
      addLog("LOT_CATEGORY_DEACTIVATED", `Categoria de lote "${cat.code}" desativada (${depCount} lotes dependentes)`);
      return { blocked: false, count: depCount };
    }
    setLotCategories((prev) => prev.map((c) => c.id === id ? { ...c, active: !c.active } : c));
    addLog("LOT_CATEGORY_TOGGLED", `Categoria de lote "${cat.code}" ${cat.active ? "desativada" : "ativada"}`);
    return { blocked: false, count: 0 };
  }, [lotCategories, lots, addLog]);

  // === Voltages ===
  const addVoltage = useCallback(async (v: Omit<Voltage, "id">) => {
    const newV = { ...v, id: `v${Date.now()}` };
    setVoltages((prev) => [...prev, newV]);
    addLog("VOLTAGE_ADDED", `Voltagem "${v.label}" criada`, undefined, JSON.stringify(newV));
  }, [addLog]);

  const updateVoltage = useCallback(async (id: string, data: Partial<Voltage>) => {
    setVoltages((prev) => {
      const old = prev.find((v) => v.id === id);
      const updated = prev.map((v) => v.id === id ? { ...v, ...data } : v);
      addLog("VOLTAGE_UPDATED", `Voltagem "${old?.label}" atualizada`, JSON.stringify(old), JSON.stringify({ ...old, ...data }));
      return updated;
    });
  }, [addLog]);

  const toggleVoltage = useCallback(async (id: string): Promise<{ blocked: boolean; count: number }> => {
    const v = voltages.find((vt) => vt.id === id);
    if (!v) return { blocked: true, count: 0 };
    const depCount = lots.filter((l) => l.voltage === v.label).length;
    setVoltages((prev) => prev.map((vt) => vt.id === id ? { ...vt, active: !vt.active } : vt));
    addLog("VOLTAGE_TOGGLED", `Voltagem "${v.label}" ${v.active ? "desativada" : "ativada"}`);
    return { blocked: false, count: depCount };
  }, [voltages, lots, addLog]);

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
      const updated = prev.map((u) => u.id === id ? { ...u, ...data } : u);
      if (data.role && old?.role !== data.role) {
        addLog("USER_ROLE_CHANGED", `Papel de "${old?.name}" alterado de ${old?.role} para ${data.role}`, JSON.stringify({ role: old?.role }), JSON.stringify({ role: data.role }));
      } else {
        addLog("USER_UPDATED", `Usuário "${old?.name}" atualizado`, JSON.stringify(old), JSON.stringify({ ...old, ...data }));
      }
      return updated;
    });
  }, [addLog]);

  const toggleUser = useCallback(async (id: string): Promise<{ blocked: boolean; reason?: string }> => {
    const target = users.find((u) => u.id === id);
    if (!target) return { blocked: true, reason: "Usuário não encontrado" };
    // If deactivating an admin, check if it's the last active admin
    if (target.active && target.role === "admin") {
      const activeAdmins = users.filter((u) => u.role === "admin" && u.active);
      if (activeAdmins.length <= 1) {
        return { blocked: true, reason: "Não é possível desativar o único administrador ativo do sistema." };
      }
    }
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: !u.active } : u));
    addLog("USER_TOGGLED", `Usuário "${target.name}" ${target.active ? "desativado" : "ativado"}`);
    return { blocked: false };
  }, [users, addLog]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <InventoryContext.Provider
      value={{
        lots, productModels, defectTypes, productCategories, lotCategories, voltages, users,
        auditLogs, notifications, palletMap,
        createLot, addItemToLot, pauseLot, resumeLot, finishLot, placePallet,
        addProductModel, addDefectType, deleteProductModel, deleteDefectType,
        addProductCategory, updateProductCategory, toggleProductCategory,
        addLotCategory, updateLotCategory, toggleLotCategory,
        addVoltage, updateVoltage, toggleVoltage,
        addUser, updateUser, toggleUser,
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
