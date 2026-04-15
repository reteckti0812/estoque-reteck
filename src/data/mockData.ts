// ============================================================
// Mock Data - Substituir por chamadas reais ao Supabase futuramente
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator";
  password: string;
}

export interface ProductModel {
  id: string;
  name: string;
  brand: string;
}

export interface DefectType {
  id: string;
  name: string;
}

export interface LotItem {
  id: string;
  productModelId: string;
  productName: string;
  defectId: string;
  defectName: string;
  observation: string;
  createdAt: string;
  createdBy: string;
}

export interface Lot {
  id: string;
  name: string;
  products: string[];
  category: string;
  voltage: string;
  lotNumber: number;
  observation: string;
  status: "active" | "paused" | "finished";
  items: LotItem[];
  createdAt: string;
  createdBy: string;
  palletAddress?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface PalletCell {
  street: string;
  column: number;
  level: number;
  lotId?: string;
  lotName?: string;
}

// ---------- Users ----------
export const mockUsers: User[] = [
  { id: "u1", name: "Carlos Admin", email: "admin@reteck.com", role: "admin", password: "admin123" },
  { id: "u2", name: "Maria Operadora", email: "maria@reteck.com", role: "operator", password: "op123" },
  { id: "u3", name: "João Operador", email: "joao@reteck.com", role: "operator", password: "op123" },
];

// ---------- Product Models ----------
export const mockProductModels: ProductModel[] = [
  { id: "pm1", name: "iPhone 13", brand: "Apple" },
  { id: "pm2", name: "iPhone 14 Pro", brand: "Apple" },
  { id: "pm3", name: "iPhone 12", brand: "Apple" },
  { id: "pm4", name: "Galaxy S23", brand: "Samsung" },
  { id: "pm5", name: "Galaxy S22 Ultra", brand: "Samsung" },
  { id: "pm6", name: "Galaxy A54", brand: "Samsung" },
  { id: "pm7", name: "Pixel 7", brand: "Google" },
  { id: "pm8", name: "MacBook Air M2", brand: "Apple" },
  { id: "pm9", name: "iPad Pro 12.9", brand: "Apple" },
  { id: "pm10", name: "Galaxy Tab S9", brand: "Samsung" },
];

// ---------- Defect Types ----------
export const mockDefectTypes: DefectType[] = [
  { id: "d1", name: "Tela Quebrada" },
  { id: "d2", name: "Bateria Inchada" },
  { id: "d3", name: "Não Liga" },
  { id: "d4", name: "Botão Home Defeituoso" },
  { id: "d5", name: "Câmera Não Funciona" },
  { id: "d6", name: "Touch Fantasma" },
  { id: "d7", name: "Alto Falante Defeituoso" },
  { id: "d8", name: "Conector de Carga Danificado" },
  { id: "d9", name: "Placa Mãe Queimada" },
  { id: "d10", name: "Sem Defeito Aparente" },
];

// ---------- Categories ----------
export const lotCategories = ["Liga", "NI", "IQ", "NF", "Cosmético", "Outro"];

// ---------- Voltages ----------
export const voltageOptions = ["110v", "220v", "Bivolt", "N/A"];

// ---------- Lots ----------
export const mockLots: Lot[] = [
  {
    id: "l1",
    name: "Lote Apple Janeiro",
    products: ["iPhone 13", "iPhone 14 Pro"],
    category: "Liga",
    voltage: "Bivolt",
    lotNumber: 1001,
    observation: "Lote de iPhones recebidos em janeiro",
    status: "active",
    items: [
      { id: "li1", productModelId: "pm1", productName: "iPhone 13", defectId: "d1", defectName: "Tela Quebrada", observation: "", createdAt: "2026-04-15T09:00:00", createdBy: "u2" },
      { id: "li2", productModelId: "pm2", productName: "iPhone 14 Pro", defectId: "d3", defectName: "Não Liga", observation: "Tentou carregar sem sucesso", createdAt: "2026-04-15T09:05:00", createdBy: "u2" },
      { id: "li3", productModelId: "pm1", productName: "iPhone 13", defectId: "d5", defectName: "Câmera Não Funciona", observation: "", createdAt: "2026-04-15T09:10:00", createdBy: "u2" },
    ],
    createdAt: "2026-04-15T08:30:00",
    createdBy: "u2",
  },
  {
    id: "l2",
    name: "Lote Samsung Fevereiro",
    products: ["Galaxy S23", "Galaxy A54"],
    category: "NI",
    voltage: "220v",
    lotNumber: 1002,
    observation: "Samsung de parceiro X",
    status: "paused",
    items: [
      { id: "li4", productModelId: "pm4", productName: "Galaxy S23", defectId: "d2", defectName: "Bateria Inchada", observation: "", createdAt: "2026-04-14T14:00:00", createdBy: "u3" },
      { id: "li5", productModelId: "pm6", productName: "Galaxy A54", defectId: "d6", defectName: "Touch Fantasma", observation: "Parte inferior da tela", createdAt: "2026-04-14T14:10:00", createdBy: "u3" },
    ],
    createdAt: "2026-04-14T13:30:00",
    createdBy: "u3",
  },
  {
    id: "l3",
    name: "Lote Misto Março",
    products: ["Pixel 7", "MacBook Air M2"],
    category: "IQ",
    voltage: "110v",
    lotNumber: 1003,
    observation: "",
    status: "finished",
    items: [
      { id: "li6", productModelId: "pm7", productName: "Pixel 7", defectId: "d10", defectName: "Sem Defeito Aparente", observation: "", createdAt: "2026-04-13T10:00:00", createdBy: "u2" },
      { id: "li7", productModelId: "pm8", productName: "MacBook Air M2", defectId: "d9", defectName: "Placa Mãe Queimada", observation: "Dano por líquido", createdAt: "2026-04-13T10:15:00", createdBy: "u2" },
    ],
    createdAt: "2026-04-13T09:00:00",
    createdBy: "u2",
    palletAddress: "E-1-3-2",
  },
];

// ---------- Audit Logs ----------
export const mockAuditLogs: AuditLog[] = [
  { id: "a1", userId: "u2", userName: "Maria Operadora", action: "LOT_CREATED", details: "Lote Apple Janeiro criado", timestamp: "2026-04-15T08:30:00" },
  { id: "a2", userId: "u2", userName: "Maria Operadora", action: "ITEM_ADDED", details: "iPhone 13 adicionado ao Lote 1001", timestamp: "2026-04-15T09:00:00" },
  { id: "a3", userId: "u3", userName: "João Operador", action: "LOT_PAUSED", details: "Lote Samsung Fevereiro pausado", timestamp: "2026-04-14T15:00:00" },
  { id: "a4", userId: "u2", userName: "Maria Operadora", action: "LOT_FINISHED", details: "Lote Misto Março finalizado - E-1-3-2", timestamp: "2026-04-13T11:00:00" },
];

// ---------- Notifications ----------
export const mockNotifications: Notification[] = [
  { id: "n1", message: "Lote Misto Março finalizado por Maria Operadora", timestamp: "2026-04-13T11:00:00", read: false },
  { id: "n2", message: "Lote Samsung Fevereiro pausado por João Operador", timestamp: "2026-04-14T15:00:00", read: false },
  { id: "n3", message: "Novo produto cadastrado: Galaxy Tab S9", timestamp: "2026-04-14T10:00:00", read: true },
];

// ---------- Warehouse Map ----------
export const streetConfig: Record<string, { columns: number; levels: number }> = {
  A: { columns: 18, levels: 7 },
  B: { columns: 18, levels: 7 },
  C: { columns: 18, levels: 7 },
  D: { columns: 18, levels: 7 },
  E: { columns: 18, levels: 7 },
  F: { columns: 8, levels: 7 },
  G: { columns: 8, levels: 7 },
  H: { columns: 8, levels: 7 },
  I: { columns: 8, levels: 7 },
  J: { columns: 10, levels: 7 },
  K: { columns: 10, levels: 7 },
  L: { columns: 10, levels: 7 },
};

export const streetLetterToNumber: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10, K: 11, L: 12,
};

export function getPalletCode(street: string, column: number, level: number): string {
  return `E-${streetLetterToNumber[street]}-${column}-${level}`;
}

// Pre-filled pallet positions
export const mockPalletMap: PalletCell[] = [
  { street: "A", column: 3, level: 2, lotId: "l3", lotName: "Lote Misto Março" },
];
