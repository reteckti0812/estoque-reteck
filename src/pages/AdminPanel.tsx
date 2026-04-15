import React, { useMemo, useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Trash2, Search, Package, Users, BarChart3, ClipboardList } from "lucide-react";
import { mockUsers } from "@/data/mockData";

const CHART_COLORS = [
  "hsl(152,55%,38%)", "hsl(210,60%,55%)", "hsl(38,92%,50%)",
  "hsl(340,60%,65%)", "hsl(0,65%,50%)", "hsl(270,50%,55%)",
];

type AdminTab = "dashboard" | "products" | "defects" | "logs" | "search";

const AdminPanel: React.FC = () => {
  const { lots, productModels, defectTypes, auditLogs, addProductModel, addDefectType, deleteProductModel, deleteDefectType } = useInventory();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [newProductName, setNewProductName] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [newDefect, setNewDefect] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Dashboard data
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    lots.forEach((l) => { map[l.category] = (map[l.category] || 0) + l.items.length; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [lots]);

  const productivityData = useMemo(() => {
    const map: Record<string, number> = {};
    lots.forEach((l) => l.items.forEach((item) => {
      const user = mockUsers.find((u) => u.id === item.createdBy);
      const name = user?.name || item.createdBy;
      map[name] = (map[name] || 0) + 1;
    }));
    return Object.entries(map).map(([name, count]) => ({ name: name.split(" ")[0], count }));
  }, [lots]);

  // Search
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    const results: { lotName: string; product: string; defect: string; date: string; user: string }[] = [];
    lots.forEach((l) => l.items.forEach((item) => {
      if (
        item.productName.toLowerCase().includes(term) ||
        item.defectName.toLowerCase().includes(term) ||
        l.name.toLowerCase().includes(term) ||
        l.lotNumber.toString().includes(term)
      ) {
        const user = mockUsers.find((u) => u.id === item.createdBy);
        results.push({
          lotName: l.name,
          product: item.productName,
          defect: item.defectName,
          date: new Date(item.createdAt).toLocaleString("pt-BR"),
          user: user?.name || "",
        });
      }
    }));
    return results;
  }, [searchTerm, lots]);

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "products", label: "Produtos", icon: <Package className="w-4 h-4" /> },
    { id: "defects", label: "Defeitos", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "logs", label: "Auditoria", icon: <Users className="w-4 h-4" /> },
    { id: "search", label: "Busca", icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Painel Administrativo</h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t.id} variant={tab === t.id ? "default" : "outline"} size="sm" onClick={() => setTab(t.id)}>
            {t.icon}
            <span className="ml-1">{t.label}</span>
          </Button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === "dashboard" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Itens por Categoria</CardTitle></CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Produtividade por Operador</CardTitle></CardHeader>
            <CardContent>
              {productivityData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={productivityData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(152,55%,38%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="md:col-span-2">
            <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total de Lotes", value: lots.length },
                { label: "Lotes Ativos", value: lots.filter((l) => l.status === "active").length },
                { label: "Total de Itens", value: lots.reduce((s, l) => s + l.items.length, 0) },
                { label: "Modelos Cadastrados", value: productModels.length },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products CRUD */}
      {tab === "products" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modelos de Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Marca" value={newProductBrand} onChange={(e) => setNewProductBrand(e.target.value)} className="w-32" />
              <Input placeholder="Nome do modelo" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className="flex-1" />
              <Button onClick={() => {
                if (newProductName && newProductBrand) {
                  addProductModel({ name: newProductName, brand: newProductBrand });
                  setNewProductName(""); setNewProductBrand("");
                }
              }}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-1 max-h-64 overflow-auto">
              {productModels.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted">
                  <span className="text-sm text-foreground">{p.brand} — {p.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => deleteProductModel(p.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t">
              <Button variant="outline" size="sm" disabled>Exportar (em breve)</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Defects CRUD */}
      {tab === "defects" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tipos de Defeito</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Nome do defeito" value={newDefect} onChange={(e) => setNewDefect(e.target.value)} className="flex-1" />
              <Button onClick={() => {
                if (newDefect) { addDefectType({ name: newDefect }); setNewDefect(""); }
              }}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-1 max-h-64 overflow-auto">
              {defectTypes.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted">
                  <span className="text-sm text-foreground">{d.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => deleteDefectType(d.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs */}
      {tab === "logs" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Logs de Auditoria</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between py-2 px-3 rounded-lg border">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{log.action}</Badge>
                      <span className="text-sm font-medium text-foreground">{log.userName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {new Date(log.timestamp).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {tab === "search" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Busca Avançada</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar por lote, produto, categoria, número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="space-y-1 max-h-96 overflow-auto">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum resultado</p>
                ) : (
                  searchResults.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border text-sm">
                      <div>
                        <span className="font-medium text-foreground">{r.product}</span>
                        <span className="text-muted-foreground"> · {r.defect} · {r.lotName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <p>{r.user}</p>
                        <p>{r.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="pt-2 border-t">
              <Button variant="outline" size="sm" disabled>Exportar Resultados (em breve)</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPanel;
