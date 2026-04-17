import React, { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

const LegendsPanel: React.FC = () => {
  const { legends } = useInventory();
  const [open, setOpen] = useState(true);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setOpen(!open)}>
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Legendas
        </CardTitle>
        <Button variant="ghost" size="sm">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CardHeader>
      {open && (
        <CardContent>
          {legends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma legenda cadastrada</p>
          ) : (
            <div className="space-y-2">
              {legends.map((l) => (
                <div key={l.id} className="flex gap-3 text-sm border-b pb-2 last:border-0">
                  <span className="font-semibold text-primary min-w-[60px]">{l.term}</span>
                  <span className="text-muted-foreground flex-1">{l.description}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default LegendsPanel;
