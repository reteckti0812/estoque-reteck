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
import { Plus, Trash2, Search, Package, Users, BarChart3, ClipboardList, Edit2, Power, Zap, FolderTree, Tag, UserPlus } from "lucide-react";
import { toast } from "sonner";

const CHART_COLORS = [
  "hsl(152,55%,38%)", "hsl(210,60%,55%)", "hsl(38,92%,50%)",
  "hsl(340,60%,65%)", "hsl(0,65%,50%)", "hsl(270,50%,55%)",
];

const PAGE_SIZE = 50;

const AdminPanel: React.FC = () => {
  const {
    lots, productModels, defectTypes, auditLogs, users,
    productCategories, lotCategories, voltages,
    addProductModel, addDefectType, deleteProductModel, deleteDefectType,
    addProductCategory, updateProductCategory, toggleProductCategory,
    addLotCategory, updateLotCategory, toggleLotCategory,
    addVoltage, updateVoltage, toggleVoltage,
    addUser, updateUser, toggleUser,
  } = useInventory();

  // --- Shared state ---
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);

  // --- Dashboard ---
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    lots.forEach((l) => { map[l.category] = (map[l.category] || 0) + l.items.length; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
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

  // --- Products ---
  const [newProductName, setNewProductName] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [productPage, setProductPage] = useState(0);

  const filteredProducts = useMemo(() => {
    if (!productFilter) return productModels;
    const t = productFilter.toLowerCase();
    return productModels.filter((p) => p.name.toLowerCase().includes(t) || p.brand.toLowerCase().includes(t));
  }, [productModels, productFilter]);

  // --- Defects ---
  const [newDefect, setNewDefect] = useState("");
  const [defectFilter, setDefectFilter] = useState("");
  const [defectPage, setDefectPage] = useState(0);

  const filteredDefects = useMemo(() => {
    if (!defectFilter) return defectTypes;
    const t = defectFilter.toLowerCase();
    return defectTypes.filter((d) => d.name.toLowerCase().includes(t));
  }, [defectTypes, defectFilter]);

  // --- Audit Logs ---
  const [logFilter, setLogFilter] = useState("");
  const [logPage, setLogPage] = useState(0);

  const filteredLogs = useMemo(() => {
    if (!logFilter) return auditLogs;
    const t = logFilter.toLowerCase();
    return auditLogs.filter((log) =>
      log.userName.toLowerCase().includes(t) || log.action.toLowerCase().includes(t) || log.details.toLowerCase().includes(t)
    );
  }, [auditLogs, logFilter]);

  // --- Search ---
  const [searchTerm, setSearchTerm] = useState("");
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const t = searchTerm.toLowerCase();
    const results: { lotName: string; product: string; defect: string; date: string; user: string }[] = [];
    lots.forEach((l) => l.items.forEach((item) => {
      if (item.productName.toLowerCase().includes(t) || item.defectName.toLowerCase().includes(t) || l.name.toLowerCase().includes(t) || l.lotNumber.toString().includes(t)) {
        const u = users.find((u) => u.id === item.createdBy);
        results.push({ lotName: l.name, product: item.productName, defect: item.defectName, date: new Date(item.createdAt).toLocaleString("pt-BR"), user: u?.name || "" });
      }
    }));
    return results;
  }, [searchTerm, lots, users]);

  // --- Product Categories ---
  const [pcFilter, setPcFilter] = useState("");
  const [pcStatusFilter, setPcStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [pcPage, setPcPage] = useState(0);
  const [pcForm, setPcForm] = useState<{ open: boolean; id?: string; name: string; description: string }>({ open: false, name: "", description: "" });

  const filteredProdCats = useMemo(() => {
    let list = productCategories;
    if (pcStatusFilter === "active") list = list.filter((c) => c.active);
    if (pcStatusFilter === "inactive") list = list.filter((c) => !c.active);
    if (pcFilter) { const t = pcFilter.toLowerCase(); list = list.filter((c) => c.name.toLowerCase().includes(t)); }
    return list;
  }, [productCategories, pcFilter, pcStatusFilter]);

  // --- Lot Categories ---
  const [lcFilter, setLcFilter] = useState("");
  const [lcStatusFilter, setLcStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [lcPage, setLcPage] = useState(0);
  const [lcForm, setLcForm] = useState<{ open: boolean; id?: string; code: string; fullName: string; description: string }>({ open: false, code: "", fullName: "", description: "" });

  const filteredLotCats = useMemo(() => {
    let list = lotCategories;
    if (lcStatusFilter === "active") list = list.filter((c) => c.active);
    if (lcStatusFilter === "inactive") list = list.filter((c) => !c.active);
    if (lcFilter) { const t = lcFilter.toLowerCase(); list = list.filter((c) => c.code.toLowerCase().includes(t) || c.fullName.toLowerCase().includes(t)); }
    return list;
  }, [lotCategories, lcFilter, lcStatusFilter]);

  // --- Voltages ---
  const [vFilter, setVFilter] = useState("");
  const [vStatusFilter, setVStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [vPage, setVPage] = useState(0);
  const [vForm, setVForm] = useState<{ open: boolean; id?: string; label: string }>({ open: false, label: "" });

  const filteredVoltages = useMemo(() => {
    let list = voltages;
    if (vStatusFilter === "active") list = list.filter((v) => v.active);
    if (vStatusFilter === "inactive") list = list.filter((v) => !v.active);
    if (vFilter) { const t = vFilter.toLowerCase(); list = list.filter((v) => v.label.toLowerCase().includes(t)); }
    return list;
  }, [voltages, vFilter, vStatusFilter]);

  // --- Users ---
  const [uFilter, setUFilter] = useState("");
  const [uStatusFilter, setUStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [uPage, setUPage] = useState(0);
  const [uForm, setUForm] = useState<{ open: boolean; id?: string; name: string; email: string; role: "admin" | "operator"; password: string }>({ open: false, name: "", email: "", role: "operator", password: "" });
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (uStatusFilter === "active") list = list.filter((u) => u.active);
    if (uStatusFilter === "inactive") list = list.filter((u) => !u.active);
    if (uFilter) { const t = uFilter.toLowerCase(); list = list.filter((u) => u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)); }
    return list;
  }, [users, uFilter, uStatusFilter]);

  // --- Helpers ---
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

  const StatusFilter = ({ value, onChange }: { value: string; onChange: (v: "all" | "active" | "inactive") => void }) => (
    <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={value} onChange={(e) => onChange(e.target.value as "all" | "active" | "inactive")}>
      <option value="all">Todos</option>
      <option value="active">Ativos</option>
      <option value="inactive">Inativos</option>
    </select>
  );

  // --- Handlers ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "product") {
      await deleteProductModel(deleteTarget.id);
      toast.success(`Produto "${deleteTarget.name}" removido`);
    } else if (deleteTarget.type === "defect") {
      await deleteDefectType(deleteTarget.id);
      toast.success(`Defeito "${deleteTarget.name}" removido`);
    }
    setDeleteTarget(null);
  };

  const handleSaveProdCat = async () => {
    if (!pcForm.name) return;
    if (pcForm.id) {
      await updateProductCategory(pcForm.id, { name: pcForm.name, description: pcForm.description });
      toast.success("Categoria de produto atualizada");
    } else {
      await addProductCategory({ name: pcForm.name, description: pcForm.description, active: true });
      toast.success("Categoria de produto criada");
    }
    setPcForm({ open: false, name: "", description: "" });
  };

  const handleSaveLotCat = async () => {
    if (!lcForm.code || !lcForm.fullName) return;
    if (lcForm.id) {
      await updateLotCategory(lcForm.id, { code: lcForm.code, fullName: lcForm.fullName, description: lcForm.description });
      toast.success("Categoria de lote atualizada");
    } else {
      await addLotCategory({ code: lcForm.code, fullName: lcForm.fullName, description: lcForm.description, active: true });
      toast.success("Categoria de lote criada — já disponível nos formulários");
    }
    setLcForm({ open: false, code: "", fullName: "", description: "" });
  };

  const handleSaveVoltage = async () => {
    if (!vForm.label) return;
    if (vForm.id) {
      await updateVoltage(vForm.id, { label: vForm.label });
      toast.success("Voltagem atualizada");
    } else {
      await addVoltage({ label: vForm.label, active: true });
      toast.success("Voltagem criada — já disponível nos formulários");
    }
    setVForm({ open: false, label: "" });
  };

  const handleToggleVoltage = async (id: string, label: string, isActive: boolean) => {
    if (isActive) {
      const depCount = lots.filter((l) => l.voltage === label).length;
      if (depCount > 0) {
        setConfirmAction({
          title: "Desativar voltagem com dependências",
          description: `Existem ${depCount} lote(s) usando "${label}". Ao desativar, os lotes existentes permanecerão, mas esta voltagem não aparecerá em novos formulários.`,
          onConfirm: async () => { await toggleVoltage(id); toast.success(`Voltagem "${label}" desativada`); setConfirmAction(null); },
        });
        return;
      }
    }
    await toggleVoltage(id);
    toast.success(`Voltagem "${label}" ${isActive ? "desativada" : "ativada"}`);
  };

  const handleToggleLotCat = async (id: string, code: string, isActive: boolean) => {
    if (isActive) {
      const depCount = lots.filter((l) => l.category === code).length;
      if (depCount > 0) {
        setConfirmAction({
          title: "Desativar categoria com dependências",
          description: `Existem ${depCount} lote(s) usando a categoria "${code}". Ao desativar, os lotes existentes permanecerão, mas esta categoria não aparecerá em novos formulários.`,
          onConfirm: async () => { await toggleLotCategory(id); toast.success(`Categoria "${code}" desativada`); setConfirmAction(null); },
        });
        return;
      }
    }
    await toggleLotCategory(id);
    toast.success(`Categoria "${code}" ${isActive ? "desativada" : "ativada"}`);
  };

  const handleSaveUser = async () => {
    if (!uForm.name || !uForm.email) return;
    if (uForm.id) {
      await updateUser(uForm.id, { name: uForm.name, email: uForm.email, role: uForm.role });
      toast.success("Usuário atualizado");
      setUForm({ open: false, name: "", email: "", role: "operator", password: "" });
    } else {
      const pw = await addUser({ name: uForm.name, email: uForm.email, role: uForm.role, password: uForm.password || "", active: true });
      setTempPassword(pw);
      toast.success("Usuário criado");
      setUForm({ open: false, name: "", email: "", role: "operator", password: "" });
    }
  };

  const handleToggleUser = async (id: string, name: string) => {
    const result = await toggleUser(id);
    if (result.blocked) {
      toast.error(result.reason || "Operação bloqueada");
    } else {
      toast.success(`Usuário "${name}" atualizado`);
    }
  };

  // --- Modal form component ---
  const FormModal = ({ open, onClose, title, children, onSave }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; onSave: () => void }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {children}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={onSave}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
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
          <TabsTrigger value="prodcats" className="gap-1"><FolderTree className="w-4 h-4" />Cat. Produto</TabsTrigger>
          <TabsTrigger value="lotcats" className="gap-1"><Tag className="w-4 h-4" />Cat. Lote</TabsTrigger>
          <TabsTrigger value="voltages" className="gap-1"><Zap className="w-4 h-4" />Voltagens</TabsTrigger>
          <TabsTrigger value="users" className="gap-1"><Users className="w-4 h-4" />Usuários</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1"><ClipboardList className="w-4 h-4" />Auditoria</TabsTrigger>
          <TabsTrigger value="search" className="gap-1"><Search className="w-4 h-4" />Busca</TabsTrigger>
        </TabsList>

        {/* ====== Dashboard ====== */}
        <TabsContent value="dashboard">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Itens por Categoria</CardTitle></CardHeader>
              <CardContent>
                {categoryData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p> : (
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

        {/* ====== Products CRUD ====== */}
        <TabsContent value="products">
          <Card>
            <CardHeader><CardTitle className="text-base">Modelos de Produtos</CardTitle></CardHeader>
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
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ type: "product", id: p.id, name: `${p.brand} — ${p.name}` })}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
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
            <CardHeader><CardTitle className="text-base">Tipos de Defeito</CardTitle></CardHeader>
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

        {/* ====== Product Categories ====== */}
        <TabsContent value="prodcats">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Categorias de Produto</CardTitle>
              <Button size="sm" onClick={() => setPcForm({ open: true, name: "", description: "" })}><Plus className="w-4 h-4 mr-1" />Novo</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Filtrar..." value={pcFilter} onChange={(e) => { setPcFilter(e.target.value); setPcPage(0); }} className="flex-1" />
                <StatusFilter value={pcStatusFilter} onChange={(v) => { setPcStatusFilter(v); setPcPage(0); }} />
              </div>
              <div className="space-y-1">
                {paginate(filteredProdCats, pcPage).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted">
                    <div>
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={c.active ? "default" : "secondary"} className="text-[10px]">{c.active ? "Ativo" : "Inativo"}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => setPcForm({ open: true, id: c.id, name: c.name, description: c.description })}><Edit2 className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={async () => { await toggleProductCategory(c.id); toast.success(`Categoria "${c.name}" ${c.active ? "desativada" : "ativada"}`); }}><Power className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                {filteredProdCats.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria encontrada</p>}
              </div>
              <PaginationControls page={pcPage} setPage={setPcPage} total={filteredProdCats.length} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== Lot Categories ====== */}
        <TabsContent value="lotcats">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Categorias de Lote</CardTitle>
              <Button size="sm" onClick={() => setLcForm({ open: true, code: "", fullName: "", description: "" })}><Plus className="w-4 h-4 mr-1" />Novo</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Filtrar..." value={lcFilter} onChange={(e) => { setLcFilter(e.target.value); setLcPage(0); }} className="flex-1" />
                <StatusFilter value={lcStatusFilter} onChange={(v) => { setLcStatusFilter(v); setLcPage(0); }} />
              </div>
              <div className="space-y-1">
                {paginate(filteredLotCats, lcPage).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted">
                    <div>
                      <span className="text-sm font-medium text-foreground">{c.code}</span>
                      <span className="text-sm text-muted-foreground ml-2">— {c.fullName}</span>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={c.active ? "default" : "secondary"} className="text-[10px]">{c.active ? "Ativo" : "Inativo"}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => setLcForm({ open: true, id: c.id, code: c.code, fullName: c.fullName, description: c.description })}><Edit2 className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleLotCat(c.id, c.code, c.active)}><Power className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                {filteredLotCats.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria encontrada</p>}
              </div>
              <PaginationControls page={lcPage} setPage={setLcPage} total={filteredLotCats.length} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== Voltages ====== */}
        <TabsContent value="voltages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Voltagens</CardTitle>
              <Button size="sm" onClick={() => setVForm({ open: true, label: "" })}><Plus className="w-4 h-4 mr-1" />Novo</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Filtrar..." value={vFilter} onChange={(e) => { setVFilter(e.target.value); setVPage(0); }} className="flex-1" />
                <StatusFilter value={vStatusFilter} onChange={(v) => { setVStatusFilter(v); setVPage(0); }} />
              </div>
              <div className="space-y-1">
                {paginate(filteredVoltages, vPage).map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted">
                    <span className="text-sm font-medium text-foreground">{v.label}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant={v.active ? "default" : "secondary"} className="text-[10px]">{v.active ? "Ativo" : "Inativo"}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => setVForm({ open: true, id: v.id, label: v.label })}><Edit2 className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleVoltage(v.id, v.label, v.active)}><Power className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                {filteredVoltages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma voltagem encontrada</p>}
              </div>
              <PaginationControls page={vPage} setPage={setVPage} total={filteredVoltages.length} />
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
              <div className="flex gap-2">
                <Input placeholder="Filtrar por nome ou email..." value={uFilter} onChange={(e) => { setUFilter(e.target.value); setUPage(0); }} className="flex-1" />
                <StatusFilter value={uStatusFilter} onChange={(v) => { setUStatusFilter(v); setUPage(0); }} />
              </div>
              <div className="space-y-1">
                {paginate(filteredUsers, uPage).map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted">
                    <div>
                      <span className="text-sm font-medium text-foreground">{u.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{u.email}</span>
                      <div className="flex gap-1 mt-0.5">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px]">{u.role}</Badge>
                        <Badge variant={u.active ? "outline" : "secondary"} className="text-[10px]">{u.active ? "Ativo" : "Inativo"}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setUForm({ open: true, id: u.id, name: u.name, email: u.email, role: u.role, password: "" })}><Edit2 className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleUser(u.id, u.name)}><Power className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário encontrado</p>}
              </div>
              <PaginationControls page={uPage} setPage={setUPage} total={filteredUsers.length} />
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
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{log.action}</Badge>
                        <span className="text-sm font-medium text-foreground">{log.userName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                      {log.oldData && <p className="text-[10px] text-muted-foreground mt-0.5">Antes: {log.oldData}</p>}
                      {log.newData && <p className="text-[10px] text-muted-foreground">Depois: {log.newData}</p>}
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

        {/* ====== Search ====== */}
        <TabsContent value="search">
          <Card>
            <CardHeader><CardTitle className="text-base">Busca Avançada</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Buscar por lote, produto, categoria, número..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              {searchTerm && (
                <div className="space-y-1 max-h-96 overflow-auto">
                  {searchResults.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum resultado</p> : (
                    searchResults.map((r, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border text-sm">
                        <div>
                          <span className="font-medium text-foreground">{r.product}</span>
                          <span className="text-muted-foreground"> · {r.defect} · {r.lotName}</span>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <p>{r.user}</p><p>{r.date}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ====== Modals ====== */}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir "{deleteTarget?.name}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generic Confirmation */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmAction?.onConfirm()}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Category Form */}
      <FormModal open={pcForm.open} onClose={() => setPcForm({ open: false, name: "", description: "" })} title={pcForm.id ? "Editar Categoria de Produto" : "Nova Categoria de Produto"} onSave={handleSaveProdCat}>
        <Input placeholder="Nome" value={pcForm.name} onChange={(e) => setPcForm({ ...pcForm, name: e.target.value })} />
        <Input placeholder="Descrição" value={pcForm.description} onChange={(e) => setPcForm({ ...pcForm, description: e.target.value })} />
      </FormModal>

      {/* Lot Category Form */}
      <FormModal open={lcForm.open} onClose={() => setLcForm({ open: false, code: "", fullName: "", description: "" })} title={lcForm.id ? "Editar Categoria de Lote" : "Nova Categoria de Lote"} onSave={handleSaveLotCat}>
        <Input placeholder="Código (ex: IQ)" value={lcForm.code} onChange={(e) => setLcForm({ ...lcForm, code: e.target.value })} />
        <Input placeholder="Nome completo" value={lcForm.fullName} onChange={(e) => setLcForm({ ...lcForm, fullName: e.target.value })} />
        <Input placeholder="Descrição" value={lcForm.description} onChange={(e) => setLcForm({ ...lcForm, description: e.target.value })} />
      </FormModal>

      {/* Voltage Form */}
      <FormModal open={vForm.open} onClose={() => setVForm({ open: false, label: "" })} title={vForm.id ? "Editar Voltagem" : "Nova Voltagem"} onSave={handleSaveVoltage}>
        <Input placeholder="Rótulo (ex: 110V)" value={vForm.label} onChange={(e) => setVForm({ ...vForm, label: e.target.value })} />
      </FormModal>

      {/* User Form */}
      <FormModal open={uForm.open} onClose={() => setUForm({ open: false, name: "", email: "", role: "operator", password: "" })} title={uForm.id ? "Editar Usuário" : "Novo Usuário"} onSave={handleSaveUser}>
        <Input placeholder="Nome" value={uForm.name} onChange={(e) => setUForm({ ...uForm, name: e.target.value })} />
        <Input placeholder="Email" type="email" value={uForm.email} onChange={(e) => setUForm({ ...uForm, email: e.target.value })} />
        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={uForm.role} onChange={(e) => setUForm({ ...uForm, role: e.target.value as "admin" | "operator" })}>
          <option value="operator">Operador</option>
          <option value="admin">Administrador</option>
        </select>
        {!uForm.id && <Input placeholder="Senha (deixe vazio para gerar)" value={uForm.password} onChange={(e) => setUForm({ ...uForm, password: e.target.value })} />}
      </FormModal>

      {/* Temp password display */}
      <AlertDialog open={!!tempPassword} onOpenChange={(open) => !open && setTempPassword(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuário criado com sucesso</AlertDialogTitle>
            <AlertDialogDescription>
              Senha temporária: <code className="bg-muted px-2 py-1 rounded font-mono">{tempPassword}</code>
              <br /><span className="text-xs">Em produção, o usuário receberá um email para definir sua senha.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setTempPassword(null)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;
