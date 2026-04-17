import React, { useState, useMemo } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { streetConfig, getPalletCode, streetLetterToNumber } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, MapPinOff } from "lucide-react";
import LegendsPanel from "@/components/LegendsPanel";

interface WarehouseMapProps {
  selectMode?: {
    lotId: string;
    onSelect: (address: string) => void;
    onCancel: () => void;
    onFinishWithoutLocation: () => void;
  };
}

const streets = Object.keys(streetConfig);

const WarehouseMap: React.FC<WarehouseMapProps> = ({ selectMode }) => {
  const { palletMap, lots } = useInventory();
  const [selectedStreet, setSelectedStreet] = useState<string>("A");
  const [inspectCell, setInspectCell] = useState<{ street: string; col: number; level: number } | null>(null);

  const config = streetConfig[selectedStreet];

  const occupiedMap = useMemo(() => {
    const map = new Map<string, { pallet: typeof palletMap[0]; isB2B: boolean }>();
    palletMap.forEach((p) => {
      const lot = lots.find((l) => l.id === p.lotId);
      map.set(`${p.street}-${p.column}-${p.level}`, { pallet: p, isB2B: lot?.isB2B || false });
    });
    return map;
  }, [palletMap, lots]);

  const inspectedEntry = inspectCell ? occupiedMap.get(`${inspectCell.street}-${inspectCell.col}-${inspectCell.level}`) : null;
  const inspectedLot = inspectedEntry ? lots.find((l) => l.id === inspectedEntry.pallet.lotId) : null;

  const handleCellClick = (col: number, level: number) => {
    const key = `${selectedStreet}-${col}-${level}`;
    const occupied = occupiedMap.has(key);

    if (selectMode && !occupied) {
      const address = getPalletCode(selectedStreet, col, level);
      selectMode.onSelect(address);
      return;
    }

    if (occupied) {
      setInspectCell({ street: selectedStreet, col, level });
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      {selectMode && (
        <Card className="border-primary bg-accent/30">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium text-foreground">
              Selecione uma posição vazia para o pallet do lote
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectMode.onFinishWithoutLocation}>
                <MapPinOff className="w-4 h-4 mr-1" /> Finalizar sem localização
              </Button>
              <Button variant="outline" size="sm" onClick={selectMode.onCancel}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Mapa do Estoque</h2>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary" /> B2B</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border" /> Vazio</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted-foreground/40" /> Outros</span>
      </div>

      {/* Street selector */}
      <div className="flex flex-wrap gap-2">
        {streets.map((s) => (
          <Button
            key={s}
            variant={selectedStreet === s ? "default" : "outline"}
            size="sm"
            onClick={() => { setSelectedStreet(s); setInspectCell(null); }}
          >
            Rua {s}
          </Button>
        ))}
      </div>

      {/* Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Rua {selectedStreet} ({streetLetterToNumber[selectedStreet]}) — {config.columns} colunas × {config.levels} níveis
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <div className="min-w-fit">
            {/* Column headers */}
            <div className="flex gap-1 mb-1 pl-8">
              {Array.from({ length: config.columns }, (_, i) => (
                <div key={i} className="w-10 text-center text-xs text-muted-foreground font-medium">
                  C{i + 1}
                </div>
              ))}
            </div>
            {/* Levels (top = 7, bottom = 1) */}
            {Array.from({ length: config.levels }, (_, li) => {
              const level = config.levels - li;
              return (
                <div key={level} className="flex gap-1 mb-1 items-center">
                  <span className="w-7 text-xs text-muted-foreground text-right">N{level}</span>
                  {Array.from({ length: config.columns }, (_, ci) => {
                    const col = ci + 1;
                    const key = `${selectedStreet}-${col}-${level}`;
                    const entry = occupiedMap.get(key);
                    const isOccupied = !!entry;
                    const isB2B = entry?.isB2B;
                    const isInspected = inspectCell?.street === selectedStreet && inspectCell?.col === col && inspectCell?.level === level;

                    let cellClass = "bg-muted border-transparent"; // empty
                    if (isInspected) {
                      cellClass = "ring-2 ring-primary border-primary bg-primary/20 text-foreground";
                    } else if (isOccupied && isB2B) {
                      cellClass = "bg-primary border-primary/50 text-primary-foreground hover:opacity-80";
                    } else if (isOccupied) {
                      cellClass = "bg-muted-foreground/40 border-muted-foreground/30 text-foreground hover:opacity-80";
                    } else if (selectMode) {
                      cellClass = "bg-muted border-dashed border-primary/30 hover:bg-primary/10 cursor-pointer";
                    }

                    return (
                      <button
                        key={col}
                        className={`w-10 h-8 rounded text-[10px] font-medium border transition-all ${cellClass}`}
                        onClick={() => handleCellClick(col, level)}
                      >
                        {isOccupied ? "●" : ""}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inspect panel */}
      {inspectCell && inspectedEntry && inspectedLot && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {getPalletCode(inspectCell.street, inspectCell.col, inspectCell.level)} — {inspectedLot.name}
                {inspectedLot.isB2B && <Badge className="bg-primary text-primary-foreground text-[10px]">B2B</Badge>}
              </CardTitle>
              <button onClick={() => setInspectCell(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{inspectedLot.items.length} produtos no pallet</p>
            <div className="space-y-1 max-h-48 overflow-auto">
              {inspectedLot.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted text-sm">
                  <span className="text-foreground">{item.productName}</span>
                  <Badge variant="secondary" className="text-xs">{item.defectName}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <LegendsPanel />
    </div>
  );
};

export default WarehouseMap;
