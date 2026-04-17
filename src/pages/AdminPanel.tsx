import React, { useMemo, useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Trash2, Package, Users, BarChart3, ClipboardList, Edit2, UserPlus, Activity, BookOpen } from "lucide-react";
import { toast } from "sonner";

const CHART_COLORS = [
  "hsl(152,55%,38%)", "hsl(210,60%,55%)", "hsl(38,92%,50%)",
  "hsl(340,60%,65%)", "hsl(0,65%,50%)", "hsl(270,50%,55%)",
];

const PAGE_SIZE = 50;

const AdminPanel: React.FC = () => {
  const {
    lots, productModels, defectTypes, auditLogs, users, legends,
    addProductModel, updateProductModel, deleteProductModel,
    addDefectType, updateDefectType, deleteDefectType,
    addUser, updateUser, deleteUser,
    addLegend, updateLegend, deleteLegend,
    deleteItem,
  } = useInventory();

  // === Dashboard ===
  const b2bData = useMemo(() => {
    const b2b = lots.filter((l) => l.isB2B).length;
    const nonB2b = lots.filter((l) => !l.isB2B).length;
    return [
      { name: "B2B", value: b2b },
      { name: "Não B2B", value: nonB2b },
    ].filter((x) => x.value > 0);
  }, [lots]);

  const productivityData = useMemo(() => {
    const map: Record<string, number> = {};
    lots.forEach((l) => l.items.forEach((item) => {
      const u = users.find((u) => u.id === item.createdBy);
      const name = u?.name || item.createdBy;
      map[name] = (map[name] || 0) + 1;
    }));
    return Object.entries(map).map(([name, count]) => ({ name: name.split(" ")[0], count }));
  }, [lots, users]);

  // === Products ===
  const [newProductName, setNewProductName] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [productPage, setProductPage] = useState(0);
  const [productEdit, setProductEdit] = useState<{ open: boolean; id?: string; name: string; brand: string }>({ open: false, name: "", brand: "" });
  const [deleteProduct, setDeleteProduct] = useState<{ id: string; name: string } | null>(null);

  const filteredProducts = useMemo(() => {
    if (!productFilter) return productModels;
    const t = productFilter.toLowerCase();
    return productModels.filter((p) => p.name.toLowerCase().includes(t) || p.brand.toLowerCase().includes(t));
  }, [productModels, productFilter]);

  // === Defects ===
  const [newDefect, setNewDefect] = useState("");
  const [defectFilter, setDefectFilter] = useState("");
  const [defectPage, setDefectPage] = useState(0);
  const [defectEdit, setDefectEdit] = useState<{ open: boolean; id?: string; name: string }>({ open: false, name: "" });
  const [deleteDefect, setDeleteDefect] = useState<{ id: string; name: string } | null>(null);

  const filteredDefects = useMemo(() => {
    if (!defectFilter) return defectTypes;
    const t = defectFilter.toLowerCase();
    return defectTypes.filter((d) => d.name.toLowerCase().includes(t));
  }, [defectTypes, defectFilter]);

  // === Users ===
  const [uFilter, setUFilter] = useState("");
  const [uPage, setUPage] = useState(0);
  const [uForm, setUForm] = useState<{ open: boolean; id?: string; name: string; email: string; role: "admin" | "operator"; password: string }>({ open: false, name: "", email: "", role: "operator", password: "" });
  const [deleteUserTarget, setDeleteUserTarget] = useState<{ id: string; name: string } | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!uFilter) return users;
    const t = uFilter.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t));
  }, [users, uFilter]);

  // === Audit Logs ===
  const [logFilter, setLogFilter] = useState("");
  const [logPage, setLogPage] = useState(0);

  const filteredLogs = useMemo(() => {
    if (!logFilter) return auditLogs;
    const t = logFilter.toLowerCase();
    return auditLogs.filter((log) =>
      log.userName.toLowerCase().includes(t) ||
      log.actionLabel.toLowerCase().includes(t) ||
      log.details.toLowerCase().includes(t)
    );
  }, [auditLogs, logFilter]);

  // === Real-time lots ===
  const [selectedRtLotId, setSelectedRtLotId] = useState<string | null>(null);
  const [deleteRtItem, setDeleteRtItem] = useState<{ lotId: string; itemId: string; name: string } | null>(null);
  const activeLots = useMemo(() => lots.filter((l) => l.status === "active" || l.status === "paused"), [lots]);
  const selectedRtLot = lots.find((l) => l.id === selectedRtLotId);

  // === Legends ===
  const [legendForm, setLegendForm] = useState<{ open: boolean; id?: string; term: string; description: string }>({ open: false, term: "", description: "" });
  const [deleteLegendTarget, setDeleteLegendTarget] = useState<{ id: string; term: string } | null>(null);

  // === Helpers ===
  const paginate = <T,>(items: T[], page: number) => items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE));

  const PaginationControls = ({ page, setPage, total }: { page: number; setPage: (p: number) => void; total: number }) => {
    const tp = totalPages(total);
    if (tp <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-3 border-t">
        <span className="text-xs text-muted-foreground">Página {page + 1} de {tp} ({total} itens)</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
          <Button variant="outline" size="sm" disabled={page >= tp - 1} onClick={() => setPage(page + 1)}>Próximo</Button>
        </div>
      </div>
    );
  };

  // === Handlers ===
  const handleSaveProduct = async () => {
    if (!productEdit.name || !productEdit.brand) return;
    if (productEdit.id) {
      await updateProductModel(productEdit.id, { name: productEdit.name, brand: productEdit.brand });
      toast.success("Produto atualizado");
    } else {
      await addProductModel({ name: productEdit.name, brand: productEdit.brand });
      toast.success("Produto criado");
    }
    setProductEdit({ open: false, name: "", brand: "" });
  };

  const handleSaveDefect = async () => {
    if (!defectEdit.name) return;
    if (defectEdit.id) {
      await updateDefectType(defectEdit.id, { name: defectEdit.name });
      toast.success("Defeito atualizado");
    } else {
      await addDefectType({ name: defectEdit.name });
      toast.success("Defeito criado");
    }
    setDefectEdit({ open: false, name: "" });
  };

  const handleSaveUser = async () => {
    if (!uForm.name || !uForm.email) return;
    if (uForm.id) {
      await updateUser(uForm.id, { name: uForm.name, email: uForm.email, role: uForm.role });
      toast.success("Usuário atualizado");
    } else {
      const pw = await addUser({ name: uForm.name, email: uForm.email, role: uForm.role, password: uForm.password || "", active: true });
      setTempPassword(pw);
      toast.success("Usuário criado");
    }
    setUForm({ open: false, name: "", email: "", role: "operator", password: "" });
  };

  const handleSaveLegend = async () => {
    if (!legendForm.term || !legendForm.description) return;
    if (legendForm.id) {
      await updateLegend(legendForm.id, { term: legendForm.term, description: legendForm.description });
      toast.success("Legenda atualizada");
    } else {
      await addLegend({ term: legendForm.term, description: legendForm.description });
      toast.success("Legenda criada");
    }
    setLegendForm({ open: false, term: "", description: "" });
  };

  return (
    <div className="animate-fade-in space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Painel Administrativo</h2>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="flex flex-wrap w-full h-auto gap-1">
          <TabsTrigger value="dashboard" className="gap-1"><BarChart3 className="w-4 h-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="realtime" className="gap-1"><Activity className="w-4 h-4" />Tempo Real</TabsTrigger>
          <TabsTrigger value="products" className="gap-1"><Package className="w-4 h-4" />Produtos</TabsTrigger>
          <TabsTrigger value="defects" className="gap-1"><ClipboardList className="w-4 h-4" />Defeitos</TabsTrigger>
          <TabsTrigger value="users" className="gap-1"><Users className="w-4 h-4" />Usuários</TabsTrigger>
          <TabsTrigger value="legends" className="gap-1"><BookOpen className="w-4 h-4" />Legendas</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1"><ClipboardList className="w-4 h-4" />Auditoria</TabsTrigger>
        </TabsList>

        {/* ====== Dashboard ====== */}
        <TabsContent value="dashboard">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Lotes B2B vs Não B2B</CardTitle></CardHeader>
              <CardContent>
                {b2bData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={b2bData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {b2bData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
                {productivityData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p> : (
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

        {/* ====== Real-time Lots ====== */}
        <TabsContent value="realtime">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Lotes em Andamento</CardTitle>
                <p className="text-xs text-muted-foreground">Atualizado em tempo real conforme operadores trabalham</p>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-auto">
                {activeLots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum lote em andamento</p>
                ) : activeLots.map((l) => {
                  const operator = users.find((u) => u.id === l.createdBy);
                  return (
                    <button
                      key={l.id}
                      onClick={() => setSelectedRtLotId(l.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedRtLotId === l.id ? "border-primary bg-accent/50" : "hover:bg-muted"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{l.name}</span>
                        <Badge variant={l.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {l.status === "active" ? "Ativo" : "Pausado"}
                        </Badge>
                      </div>
                      <div className="flex gap-2 items-center text-xs text-muted-foreground">
                        <span>{l.items.length} itens</span>
                        {l.isB2B && <Badge variant="outline" className="text-[10px]">B2B</Badge>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{operator?.name}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedRtLot ? `Itens — ${selectedRtLot.name}` : "Selecione um lote"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedRtLot ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Selecione um lote à esquerda para ver e editar seus itens</p>
                ) : selectedRtLot.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum item neste lote ainda</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-auto">
                    {selectedRtLot.items.slice().reverse().map((item) => (
                      <div key={item.id} className="flex items-start justify-between p-3 rounded-lg border">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.defectName}</p>
                          {item.observation && <p className="text-xs text-muted-foreground italic mt-1">Obs: {item.observation}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(item.createdAt).toLocaleString("pt-BR")} · {users.find((u) => u.id === item.createdBy)?.name}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteRtItem({ lotId: selectedRtLot.id, itemId: item.id, name: item.productName })}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ====== Products CRUD ====== */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Modelos de Produtos</CardTitle>
              <Button size="sm" onClick={() => setProductEdit({ open: true, name: "", brand: "" })}><Plus className="w-4 h-4 mr-1" />Novo</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Marca" value={newProductBrand} onChange={(e) => setNewProductBrand(e.target.value)} className="w-32" />
                <Input placeholder="Nome do modelo" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className="flex-1" />
                <Button onClick={async () => { if (newProductName && newProductBrand) { await addProductModel({ name: newProductName, brand: newProductBrand }); setNewProductName(""); setNewProductBrand(""); toast.success("Produto adicionado"); } }}><Plus className="w-4 h-4" /></Button>
              </div>
              <Input placeholder="Filtrar produtos..." value={productFilter} onChange={(e) => { setProductFilter(e.target.value); setProductPage(0); }} />
              <div className="space-y-1">
                {paginate(filteredProducts, productPage).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted">
                    <span className="text-sm text-foreground">{p.brand} — {p.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setProductEdit({ open: true, id: p.id, name: p.name, brand: p.brand })}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteProduct({ id: p.id, name: `${p.brand} — ${p.name}` })}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto encontrado</p>}
              </div>
              <PaginationControls page={productPage} setPage={setProductPage} total={filteredProducts.length} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== Defects CRUD ====== */}
        <TabsContent value="defects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Tipos de Defeito</CardTitle>
              <Button size="sm" onClick={() => setDefectEdit({ open: true, name: "" })}><Plus className="w-4 h-4 mr-1" />Novo</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Nome do defeito" value={newDefect} onChange={(e) => setNewDefect(e.target.value)} className="flex-1" />
                <Button onClick={async () => { if (newDefect) { await addDefectType({ name: newDefect }); setNewDefect(""); toast.success("Defeito adicionado"); } }}><Plus className="w-4 h-4" /></Button>
              </div>
              <Input placeholder="Filtrar defeitos..." value={defectFilter} onChange={(e) => { setDefectFilter(e.target.value); setDefectPage(0); }} />
              <div className="space-y-1">
                {paginate(filteredDefects, defectPage).map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted">
                    <span className="text-sm text-foreground">{d.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setDefectEdit({ open: true, id: d.id, name: d.name })}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteDefect({ id: d.id, name: d.name })}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredDefects.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum defeito encontrado</p>}
              </div>
              <PaginationControls page={defectPage} setPage={setDefectPage} total={filteredDefects.length} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== Users ====== */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Usuários</CardTitle>
              <Button size="sm" onClick={() => setUForm({ open: true, name: "", email: "", role: "operator", password: "" })}><UserPlus className="w-4 h-4 mr-1" />Novo</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Filtrar por nome ou email..." value={uFilter} onChange={(e) => { setUFilter(e.target.value); setUPage(0); }} />
              <div className="space-y-1">
                {paginate(filteredUsers, uPage).map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted">
                    <div>
                      <span className="text-sm font-medium text-foreground">{u.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{u.email}</span>
                      <div className="flex gap-1 mt-0.5">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px]">{u.role}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setUForm({ open: true, id: u.id, name: u.name, email: u.email, role: u.role, password: "" })}><Edit2 className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteUserTarget({ id: u.id, name: u.name })}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário encontrado</p>}
              </div>
              <PaginationControls page={uPage} setPage={setUPage} total={filteredUsers.length} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== Legends ====== */}
        <TabsContent value="legends">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Legendas (nomenclaturas de lotes)</CardTitle>
              <Button size="sm" onClick={() => setLegendForm({ open: true, term: "", description: "" })}><Plus className="w-4 h-4 mr-1" />Nova</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">As legendas aparecem para todos os usuários nas telas de Lotes e Mapa.</p>
              <div className="space-y-1">
                {legends.map((l) => (
                  <div key={l.id} className="flex items-start justify-between py-2 px-3 rounded-lg hover:bg-muted">
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-primary">{l.term}</span>
                      <p className="text-xs text-muted-foreground">{l.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setLegendForm({ open: true, id: l.id, term: l.term, description: l.description })}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteLegendTarget({ id: l.id, term: l.term })}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {legends.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma legenda cadastrada</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== Audit Logs ====== */}
        <TabsContent value="logs">
          <Card>
            <CardHeader><CardTitle className="text-base">Logs de Auditoria</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Filtrar logs por usuário, ação ou detalhe..." value={logFilter} onChange={(e) => { setLogFilter(e.target.value); setLogPage(0); }} />
              <div className="space-y-2">
                {paginate(filteredLogs, logPage).map((log) => (
                  <div key={log.id} className="flex items-start justify-between py-2 px-3 rounded-lg border">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">{log.actionLabel}</Badge>
                        <span className="text-sm font-medium text-foreground">{log.userName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                      {log.oldData && <p className="text-[10px] text-muted-foreground mt-0.5 break-all">Antes: {log.oldData}</p>}
                      {log.newData && <p className="text-[10px] text-muted-foreground break-all">Depois: {log.newData}</p>}
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
      </Tabs>

      {/* ===== Modals ===== */}

      {/* Product edit modal */}
      <AlertDialog open={productEdit.open} onOpenChange={(o) => !o && setProductEdit({ open: false, name: "", brand: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{productEdit.id ? "Editar Produto" : "Novo Produto"}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3">
            <Input placeholder="Marca" value={productEdit.brand} onChange={(e) => setProductEdit({ ...productEdit, brand: e.target.value })} />
            <Input placeholder="Nome" value={productEdit.name} onChange={(e) => setProductEdit({ ...productEdit, name: e.target.value })} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveProduct}>Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product delete */}
      <AlertDialog open={!!deleteProduct} onOpenChange={(o) => !o && setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir "{deleteProduct?.name}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => { if (deleteProduct) { await deleteProductModel(deleteProduct.id); toast.success("Produto excluído"); setDeleteProduct(null); } }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Defect edit modal */}
      <AlertDialog open={defectEdit.open} onOpenChange={(o) => !o && setDefectEdit({ open: false, name: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{defectEdit.id ? "Editar Defeito" : "Novo Defeito"}</AlertDialogTitle>
          </AlertDialogHeader>
          <Input placeholder="Nome do defeito" value={defectEdit.name} onChange={(e) => setDefectEdit({ ...defectEdit, name: e.target.value })} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveDefect}>Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Defect delete */}
      <AlertDialog open={!!deleteDefect} onOpenChange={(o) => !o && setDeleteDefect(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir defeito?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir "{deleteDefect?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => { if (deleteDefect) { await deleteDefectType(deleteDefect.id); toast.success("Defeito excluído"); setDeleteDefect(null); } }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User form modal */}
      <AlertDialog open={uForm.open} onOpenChange={(o) => !o && setUForm({ open: false, name: "", email: "", role: "operator", password: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{uForm.id ? "Editar Usuário" : "Novo Usuário"}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome completo" value={uForm.name} onChange={(e) => setUForm({ ...uForm, name: e.target.value })} />
            <Input placeholder="Email" type="email" value={uForm.email} onChange={(e) => setUForm({ ...uForm, email: e.target.value })} />
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={uForm.role} onChange={(e) => setUForm({ ...uForm, role: e.target.value as "admin" | "operator" })}>
              <option value="operator">Operador</option>
              <option value="admin">Administrador</option>
            </select>
            {!uForm.id && <Input placeholder="Senha (deixe vazio para gerar temporária)" type="text" value={uForm.password} onChange={(e) => setUForm({ ...uForm, password: e.target.value })} />}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveUser}>Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User temp password */}
      <AlertDialog open={!!tempPassword} onOpenChange={(o) => !o && setTempPassword(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Senha temporária gerada</AlertDialogTitle>
            <AlertDialogDescription>
              Compartilhe esta senha com o usuário: <code className="bg-muted px-2 py-1 rounded font-mono">{tempPassword}</code>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setTempPassword(null)}>Ok</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User delete */}
      <AlertDialog open={!!deleteUserTarget} onOpenChange={(o) => !o && setDeleteUserTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteUserTarget?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteUserTarget) return;
                const result = await deleteUser(deleteUserTarget.id);
                if (result.blocked) toast.error(result.reason || "Operação bloqueada");
                else toast.success(`Usuário "${deleteUserTarget.name}" excluído`);
                setDeleteUserTarget(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Legend form modal */}
      <AlertDialog open={legendForm.open} onOpenChange={(o) => !o && setLegendForm({ open: false, term: "", description: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{legendForm.id ? "Editar Legenda" : "Nova Legenda"}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3">
            <Input placeholder="Termo (ex: B2B)" value={legendForm.term} onChange={(e) => setLegendForm({ ...legendForm, term: e.target.value })} />
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
              placeholder="Descrição do termo..."
              value={legendForm.description}
              onChange={(e) => setLegendForm({ ...legendForm, description: e.target.value })}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveLegend}>Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Legend delete */}
      <AlertDialog open={!!deleteLegendTarget} onOpenChange={(o) => !o && setDeleteLegendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir legenda?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir a legenda "{deleteLegendTarget?.term}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => { if (deleteLegendTarget) { await deleteLegend(deleteLegendTarget.id); toast.success("Legenda excluída"); setDeleteLegendTarget(null); } }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Real-time item delete */}
      <AlertDialog open={!!deleteRtItem} onOpenChange={(o) => !o && setDeleteRtItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item do lote?</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir "{deleteRtItem?.name}" do lote? Esta ação será registrada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteRtItem) return;
                await deleteItem(deleteRtItem.lotId, deleteRtItem.itemId);
                toast.success("Item excluído");
                setDeleteRtItem(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;
