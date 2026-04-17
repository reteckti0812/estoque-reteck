import React, { useState, useMemo } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import AutocompleteInput from "@/components/AutocompleteInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Send, Pause, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";

interface ProductIdentificationProps {
  lotId: string;
  onBack: () => void;
  onFinish: (lotId: string) => void;
}

const ProductIdentification: React.FC<ProductIdentificationProps> = ({ lotId, onBack, onFinish }) => {
  const { lots, productModels, defectTypes, addItemToLot, pauseLot, deleteLastItem } = useInventory();
  const lot = lots.find((l) => l.id === lotId);

  const [productName, setProductName] = useState("");
  const [productId, setProductId] = useState("");
  const [defectName, setDefectName] = useState("");
  const [defectId, setDefectId] = useState("");
  const [observation, setObservation] = useState("");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [confirmDeleteLast, setConfirmDeleteLast] = useState(false);

  const productOptions = productModels.map((p) => ({ id: p.id, label: `${p.brand} - ${p.name}` }));
  const defectOptions = defectTypes.map((d) => ({ id: d.id, label: d.name }));

  const lastItems = useMemo(() => (lot?.items || []).slice(-5).reverse(), [lot?.items]);
  const lastItem = lot?.items[lot.items.length - 1];

  const submitItem = async () => {
    if (!productName || !defectName) return;
    await addItemToLot(lotId, {
      productModelId: productId,
      productName,
      defectId,
      defectName,
      observation,
    });
    setProductName("");
    setProductId("");
    setDefectName("");
    setDefectId("");
    setObservation("");
    setShowDuplicateModal(false);
  };

  const handleSend = () => {
    if (!productName || !defectName) return;
    if (lastItem && lastItem.productName === productName && lastItem.defectName === defectName) {
      setShowDuplicateModal(true);
      return;
    }
    submitItem();
  };

  const handlePause = async () => {
    await pauseLot(lotId);
    onBack();
  };

  if (!lot) return <p className="text-muted-foreground">Lote não encontrado</p>;

  return (
    <div className="animate-fade-in space-y-4">
      {/* Duplicate modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <Card className="w-96 animate-fade-in">
            <CardContent className="p-6 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-warning mx-auto" />
              <h3 className="font-semibold text-foreground">Atenção: Produto Duplicado</h3>
              <p className="text-sm text-muted-foreground">
                Este produto é igual ao anterior ({lastItem?.productName} — {lastItem?.defectName}). Deseja realmente duplicar este item?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowDuplicateModal(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={submitItem}>
                  Sim, Duplicar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirm delete last */}
      <AlertDialog open={confirmDeleteLast} onOpenChange={setConfirmDeleteLast}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir último item?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o último item cadastrado ({lastItem?.productName} — {lastItem?.defectName})? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => { await deleteLastItem(lotId); setConfirmDeleteLast(false); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{lot.name}</h2>
          <p className="text-sm text-muted-foreground">
            {lot.items.length} itens{lot.observation ? ` · "${lot.observation}"` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {lot.isB2B && <Badge className="bg-primary text-primary-foreground">B2B</Badge>}
          <Badge variant="default">Ativo</Badge>
        </div>
      </div>

      {/* Dual card layout */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left: Form */}
        <Card>
          <CardHeader><CardTitle className="text-base">Cadastrar Produto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Produto *</label>
              <AutocompleteInput
                options={productOptions}
                value={productName}
                onChange={(v, id) => { setProductName(v); setProductId(id || ""); }}
                placeholder="Buscar produto..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Defeito *</label>
              <AutocompleteInput
                options={defectOptions}
                value={defectName}
                onChange={(v, id) => { setDefectName(v); setDefectId(id || ""); }}
                placeholder="Buscar defeito..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Observação</label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Observação opcional..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Right: Live Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimos Itens Cadastrados</CardTitle>
            {lastItem && (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteLast(true)} className="text-destructive">
                <Trash2 className="w-3 h-3 mr-1" /> Excluir último
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {lastItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum item cadastrado ainda</p>
            ) : (
              <div className="space-y-2">
                {lastItems.map((item, i) => (
                  <div key={item.id} className={`p-3 rounded-lg border ${i === 0 ? "bg-accent/50 border-primary/20" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.defectName}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {item.observation && (
                      <p className="text-xs text-muted-foreground mt-2 italic border-t pt-2">
                        Obs: {item.observation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer actions */}
      <div className="flex gap-3">
        <Button onClick={handleSend} className="flex-1" size="lg">
          <Send className="w-4 h-4 mr-2" /> Enviar
        </Button>
        <Button variant="outline" onClick={handlePause} size="lg">
          <Pause className="w-4 h-4 mr-2" /> Pausar
        </Button>
        <Button variant="secondary" onClick={() => onFinish(lotId)} size="lg">
          <CheckCircle className="w-4 h-4 mr-2" /> Finalizar
        </Button>
      </div>
    </div>
  );
};

export default ProductIdentification;
