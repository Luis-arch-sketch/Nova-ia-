import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EffortSelector } from "./effort-selector";
import { EFFORT_LEVELS, effortIndex, type EffortLevel } from "@/lib/effort";

export function ComposerMenu({ effort, onChange }: { effort: EffortLevel; onChange: (value: EffortLevel) => void }) {
  const [open, setOpen] = useState(false);
  const selected = EFFORT_LEVELS[effortIndex(effort)]!;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Abrir opções da NOVA IA" title="Opções e esforço" className="composer-plus">
          <Plus aria-hidden="true" size={22} />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={12} collisionPadding={12} aria-label="Opções da NOVA IA" className={`nova-options theme-${selected.theme}`}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="font-semibold">Opções da NOVA IA</h2>
          <button type="button" aria-label="Fechar opções" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"><X size={18} /></button>
        </div>
        <EffortSelector value={effort} onChange={onChange} />
        <p className="mt-2 text-xs text-muted-foreground">O esforço ajusta o tamanho e o detalhamento da resposta.</p>
        <div className="mt-4 grid gap-2 border-t pt-3">
          {["Criar imagem", "Criar vídeo", "Página web"].map((label) => (
            <button key={label} type="button" disabled className="flex justify-between rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground">
              {label}<span className="text-xs">Em breve</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
