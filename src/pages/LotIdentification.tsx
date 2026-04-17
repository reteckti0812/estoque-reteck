import React, { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Clock, Package, MapPin } from "lucide-react";
import LegendsPanel from "@/components/LegendsPanel";

interface LotIdentificationProps {
  onStartLot: (lotId: string) => void;
  onAddressLot: (lotId: string) => void;
}

type View = "form" | "paused" | "awaiting";

const LotIdentification: React.FC<LotIdentificationProps> = ({ onStartLot, onAddressLot }) => {
  const { lots, createLot, resumeLot } = useInventory();
  const [view, setView] = useState<View>("form");

  const [name, setName] = useState("");
  const [isB2B, setIsB2B] = useState<"yes" | "no" | "">("");
  const [observation, setObservation] = useState("");

  const pausedLots = lots.filter((l) => l.status === "paused");
  const awaitingLots = lots.filter((l) => l.status === "awaiting_location");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || isB2B === "") return;
    const lot = await createLot({ name, isB2B: isB2B === "yes", observation });
    setName(""); setIsB2B(""); setObservation("");
    onStartLot(lot.id);
  };

  const handleResume = async (lotId: string) => {
    await resumeLot(lotId);
    onStartLot(lotId);
  };

  if (view === "paused") {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Lotes Pausados</h2>
          <Button variant="outline" onClick={() => setView("form")}>Voltar</Button>
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
                  <div className="flex gap-3 text-sm text-muted-foreground flex-wrap">
                    <span>{lot.items.length} itens</span>
                    {lot.isB2B && <Badge variant="outline" className="text-[10px]">B2B</Badge>}
                  </div>
                  {lot.observation && <p className="text-xs text-muted-foreground italic">"{lot.observation}"</p>}
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

  if (view === "awaiting") {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Lotes Aguardando Localização</h2>
          <Button variant="outline" onClick={() => setView("form")}>Voltar</Button>
        </div>
        {awaitingLots.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum lote aguardando localização</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {awaitingLots.map((lot) => (
              <Card key={lot.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{lot.name}</CardTitle>
                    <Badge className="bg-warning text-warning-foreground"><MapPin className="w-3 h-3 mr-1" /> Sem local</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-3 text-sm text-muted-foreground flex-wrap">
                    <span>{lot.items.length} itens</span>
                    {lot.isB2B && <Badge variant="outline" className="text-[10px]">B2B</Badge>}
                  </div>
                  {lot.observation && <p className="text-xs text-muted-foreground italic">"{lot.observation}"</p>}
                  <Button size="sm" onClick={() => onAddressLot(lot.id)} className="w-full mt-2">
                    <MapPin className="w-3 h-3 mr-1" /> Endereçar no Mapa
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold text-foreground">Identificação do Lote</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setView("paused")}>
            <Pause className="w-4 h-4 mr-2" /> Pausados ({pausedLots.length})
          </Button>
          <Button variant="outline" size="sm" onClick={() => setView("awaiting")}>
            <MapPin className="w-4 h-4 mr-2" /> Sem localização ({awaitingLots.length})
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome do Lote *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Lote Apple Abril" required />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">É B2B? *</label>
              <div className="flex gap-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer flex-1 border rounded-lg p-3 hover:bg-accent">
                  <input type="radio" name="b2b" checked={isB2B === "yes"} onChange={() => setIsB2B("yes")} />
                  <span className="text-sm font-medium">Sim, é B2B</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer flex-1 border rounded-lg p-3 hover:bg-accent">
                  <input type="radio" name="b2b" checked={isB2B === "no"} onChange={() => setIsB2B("no")} />
                  <span className="text-sm font-medium">Não é B2B</span>
                </label>
              </div>
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

            <Button type="submit" className="w-full" size="lg" disabled={!name || isB2B === ""}>
              <Package className="w-4 h-4 mr-2" /> Iniciar Lote
            </Button>
          </form>
        </CardContent>
      </Card>

      <LegendsPanel />
    </div>
  );
};

export default LotIdentification;
