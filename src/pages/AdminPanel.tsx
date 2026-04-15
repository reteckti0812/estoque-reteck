import React, { useMemo, useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Trash2, Search, Package, Users, BarChart3, ClipboardList } from "lucide-react";
import { mockUsers } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const CHART_COLORS = [
  "hsl(152,55%,38%)", "hsl(210,60%,55%)", "hsl(38,92%,50%)",
  "hsl(340,60%,65%)", "hsl(0,65%,50%)", "hsl(270,50%,55%)",
];

const PAGE_SIZE = 10;

const AdminPanel: React.FC = () => {
  const { lots, productModels, defectTypes, auditLogs, addProductModel, addDefectType, deleteProductModel, deleteDefectType } = useInventory();
  const { toast } = useToast();

  const [newProductName, setNewProductName] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [newDefect, setNewDefect] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [productPage, setProductPage] = useState(0);
  const [defectPage, setDefectPage] = useState(0);
  const [logPage, setLogPage] = useState(0);

  // Filter states
  const [productFilter, setProductFilter] = useState("");
  const [defectFilter, setDefectFilter] = useState("");
  const [logFilter, setLogFilter] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: "product" | "defect"; id: string; name: string } | null>(null);

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

  // Filtered & paginated lists
  const filteredProducts = useMemo(() => {
    if (!productFilter) return productModels;
    const term = productFilter.toLowerCase();
    return productModels.filter((p) => p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term));
  }, [productModels, productFilter]);

  const filteredDefects = useMemo(() => {
    if (!defectFilter) return defectTypes;
    const term = defectFilter.toLowerCase();
    return defectTypes.filter((d) => d.name.toLowerCase().includes(term));
  }, [defectTypes, defectFilter]);

  const filteredLogs = useMemo(() => {
    if (!logFilter) return auditLogs;
    const term = logFilter.toLowerCase();
    return auditLogs.filter((log) =>
      log.userName.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    );
  }, [auditLogs, logFilter]);

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

  const handleAddProduct = async () => {
    if (newProductName && newProductBrand) {
      await addProductModel({ name: newProductName, brand: newProductBrand });
      setNewProductName("");
      setNewProductBrand("");
      toast({ title: "Produto adicionado", description: `${newProductBrand} — ${newProductName} cadastrado com sucesso.` });
    }
  };

  const handleAddDefect = async () => {
    if (newDefect) {
      await addDefectType({ name: newDefect });
      setNewDefect("");
      toast({ title: "Defeito adicionado", description: `"${newDefect}" cadastrado com sucesso.` });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "product") {
      await deleteProductModel(deleteTarget.id);
      toast({ title: "Produto removido", description: `"${deleteTarget.name}" foi excluído.`, variant: "destructive" });
    } else {
      await deleteDefectType(deleteTarget.id);
      toast({ title: "Defeito removido", description: `"${deleteTarget.name}" foi excluído.`, variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const paginate = <T,>(items: T[], page: number) => items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE));

  const PaginationControls = ({ page, setPage, total }: { page: number; setPage: (p: number) => void; total: number }) => {
    const tp = totalPages(total);
    if (tp <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-3 border-t">
        <span className="text-xs text-muted-foreground">Página {page + 1} de {tp}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
          <Button variant="outline" size="sm" disabled={page >= tp - 1} onClick={() => setPage(page + 1)}>Próximo</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Painel Administrativo</h2>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="flex flex-wrap w-full h-auto gap-1">
          <TabsTrigger value="dashboard" className="gap-1"><BarChart3 className="w-4 h-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="products" className="gap-1"><Package className="w-4 h-4" />Produtos</TabsTrigger>
          <TabsTrigger value="defects" className="gap-1"><ClipboardList className="w-4 h-4" />Defeitos</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1"><Users className="w-4 h-4" />Auditoria</TabsTrigger>
          <TabsTrigger value="search" className="gap-1"><Search className="w-4 h-4" />Busca</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard">
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
        </TabsContent>

        {/* Products CRUD */}
        <TabsContent value="products">
          <Card>
            <CardHeader><CardTitle className="text-base">Modelos de Produtos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Marca" value={newProductBrand} onChange={(e) => setNewProductBrand(e.target.value)} className="w-32" />
                <Input placeholder="Nome do modelo" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className="flex-1" />
                <Button onClick={handleAddProduct}><Plus className="w-4 h-4" /></Button>
              </div>
              <Input placeholder="Filtrar produtos..." value={productFilter} onChange={(e) => { setProductFilter(e.target.value); setProductPage(0); }} />
              <div className="space-y-1">
                {paginate(filteredProducts, productPage).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted">
                    <span className="text-sm text-foreground">{p.brand} — {p.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ type: "product", id: p.id, name: `${p.brand} — ${p.name}` })}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
                {filteredProducts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto encontrado</p>}
              </div>
              <PaginationControls page={productPage} setPage={setProductPage} total={filteredProducts.length} />
              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" disabled>Exportar (em breve)</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defects CRUD */}
        <TabsContent value="defects">
          <Card>
            <CardHeader><CardTitle className="text-base">Tipos de Defeito</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Nome do defeito" value={newDefect} onChange={(e) => setNewDefect(e.target.value)} className="flex-1" />
                <Button onClick={handleAddDefect}><Plus className="w-4 h-4" /></Button>
              </div>
              <Input placeholder="Filtrar defeitos..." value={defectFilter} onChange={(e) => { setDefectFilter(e.target.value); setDefectPage(0); }} />
              <div className="space-y-1">
                {paginate(filteredDefects, defectPage).map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted">
                    <span className="text-sm text-foreground">{d.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ type: "defect", id: d.id, name: d.name })}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
                {filteredDefects.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum defeito encontrado</p>}
              </div>
              <PaginationControls page={defectPage} setPage={setDefectPage} total={filteredDefects.length} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader><CardTitle className="text-base">Logs de Auditoria</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Filtrar logs por usuário, ação ou detalhe..." value={logFilter} onChange={(e) => { setLogFilter(e.target.value); setLogPage(0); }} />
              <div className="space-y-2">
                {paginate(filteredLogs, logPage).map((log) => (
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
                {filteredLogs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum log encontrado</p>}
              </div>
              <PaginationControls page={logPage} setPage={setLogPage} total={filteredLogs.length} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search */}
        <TabsContent value="search">
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
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;
