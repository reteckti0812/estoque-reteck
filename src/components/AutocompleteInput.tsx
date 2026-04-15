import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface AutocompleteInputProps {
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string, id?: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ options, value, onChange, placeholder, disabled }) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) => o.label.toLowerCase().includes((filter || value).toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Input
        value={filter !== "" ? filter : value}
        onChange={(e) => {
          setFilter(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-auto">
          {filtered.map((o) => (
            <button
              key={o.id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
              onClick={() => {
                onChange(o.label, o.id);
                setFilter("");
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
