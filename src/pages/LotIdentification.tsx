import React, { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { lotCategories, voltageOptions } from "@/data/mockData";
import AutocompleteInput from "@/components/AutocompleteInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Clock, Package } from "lucide-react";

interface LotIdentificationProps {
  onStartLot: (lotId: string) => void;
}

const LotIdentification: React.FC<LotIdentificationProps> = ({ onStartLot }) => {
  const { lots, productModels, createLot, resumeLot } = useInventory();
  const [showPaused, setShowPaused] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentProduct, setCurrentProduct] = useState("");
  const [category, setCategory] = useState("");
  const [voltage, setVoltage] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [observation, setObservation] = useState("");

  const productOptions = productModels.map((p) => ({ id: p.id, label: `${p.brand} - ${p.name}` }));
  const pausedLots = lots.filter((l) => l.status === "paused");

  const handleAddProduct = () => {
    if (currentProduct && !selectedProducts.includes(currentProduct)) {
      setSelectedProducts([...selectedProducts, currentProduct]);
      setCurrentProduct("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !lotNumber) return;
    const lot = await createLot({
      name,
      products: selectedProducts,
      category,
      voltage,
      lotNumber: parseInt(lotNumber),
      observation,
    });
    onStartLot(lot.id);
  };

  const handleResume = async (lotId: string) => {
    await resumeLot(lotId);
    onStartLot(lotId);
  };

  if (showPaused) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Lotes Pausados</h2>
          <Button variant="outline" onClick={() => setShowPaused(false)}>Voltar</Button>
        </div>
        {pausedLots.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum lote pausado</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pausedLots.map((lot) => (
              <Card key={lot.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{lot.name}</CardTitle>
                    <Badge variant="secondary"><Pause className="w-3 h-3 mr-1" /> Pausado</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Nº {lot.lotNumber}</span>
                    <span>{lot.category}</span>
                    <span>{lot.items.length} itens</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(lot.createdAt).toLocaleString("pt-BR")}
                  </p>
                  <Button size="sm" onClick={() => handleResume(lot.id)} className="w-full mt-2">
                    <Play className="w-3 h-3 mr-1" /> Retomar Lote
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Identificação do Lote</h2>
        <Button variant="outline" onClick={() => setShowPaused(true)}>
          <Pause className="w-4 h-4 mr-2" /> Lotes Pausados ({pausedLots.length})
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome do Lote *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Lote Apple Abril" required />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Produtos do Lote *</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <AutocompleteInput
                    options={productOptions}
                    value={currentProduct}
                    onChange={(v) => setCurrentProduct(v)}
                    placeholder="Buscar produto..."
                  />
                </div>
                <Button type="button" variant="outline" onClick={handleAddProduct}>+</Button>
              </div>
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedProducts.map((p, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setSelectedProducts(selectedProducts.filter((_, j) => j !== i))}>
                      {p} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Categoria *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {lotCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Voltagem</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={voltage}
                  onChange={(e) => setVoltage(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {voltageOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Número do Lote *</label>
              <Input type="number" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} placeholder="Ex: 1004" required />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Observação</label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Observações opcionais..."
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Package className="w-4 h-4 mr-2" /> Iniciar Lote
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LotIdentification;
