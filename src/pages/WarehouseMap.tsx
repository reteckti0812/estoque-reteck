import React, { useState, useMemo } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { streetConfig, getPalletCode, streetLetterToNumber } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface WarehouseMapProps {
  selectMode?: { lotId: string; onSelect: (address: string) => void; onCancel: () => void };
}

const streets = Object.keys(streetConfig);

const WarehouseMap: React.FC<WarehouseMapProps> = ({ selectMode }) => {
  const { palletMap, lots } = useInventory();
  const [selectedStreet, setSelectedStreet] = useState<string>("A");
  const [inspectCell, setInspectCell] = useState<{ street: string; col: number; level: number } | null>(null);

  const config = streetConfig[selectedStreet];

  const occupiedMap = useMemo(() => {
    const map = new Map<string, typeof palletMap[0]>();
    palletMap.forEach((p) => map.set(`${p.street}-${p.column}-${p.level}`, p));
    return map;
  }, [palletMap]);

  const inspectedPallet = inspectCell ? occupiedMap.get(`${inspectCell.street}-${inspectCell.col}-${inspectCell.level}`) : null;
  const inspectedLot = inspectedPallet ? lots.find((l) => l.id === inspectedPallet.lotId) : null;

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
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Selecione uma posição vazia para o pallet do lote
            </p>
            <Button variant="outline" size="sm" onClick={selectMode.onCancel}>Cancelar</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Mapa do Estoque</h2>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-map-entrance" /> Entrada</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-map-table" /> Mesas</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-map-corridor" /> Corredores</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-map-empty border" /> Vazio</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-map-occupied" /> Ocupado</span>
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
                    const isOccupied = occupiedMap.has(key);
                    const isInspected = inspectCell?.street === selectedStreet && inspectCell?.col === col && inspectCell?.level === level;

                    return (
                      <button
                        key={col}
                        className={`w-10 h-8 rounded text-[10px] font-medium border transition-all ${
                          isInspected
                            ? "ring-2 ring-primary border-primary bg-primary/20 text-foreground"
                            : isOccupied
                            ? "bg-map-occupied border-map-occupied/50 text-foreground hover:opacity-80"
                            : selectMode
                            ? "bg-map-empty border-dashed border-primary/30 hover:bg-primary/10 cursor-pointer"
                            : "bg-map-empty border-transparent"
                        }`}
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
      {inspectCell && inspectedPallet && inspectedLot && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {getPalletCode(inspectCell.street, inspectCell.col, inspectCell.level)} — {inspectedLot.name}
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
    </div>
  );
};

export default WarehouseMap;
