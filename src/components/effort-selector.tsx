import { useEffect, useId, useRef } from "react";
import { ChevronRight, RotateCcw, Zap } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_EFFORT, EFFORT_LEVELS, effortIndex, isEffortLevel, type EffortLevel } from "@/lib/effort";
import { MODEL_NAME } from "@/lib/nova-engine";

type Props = { value: EffortLevel; onChange: (value: EffortLevel) => void };

export function EffortSelector({ value, onChange }: Props) {
  const id = useId();
  const index = effortIndex(value);
  const selected = EFFORT_LEVELS[index]!;
  const sliderRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const thumb = sliderRef.current?.querySelector('[role="slider"]');
    thumb?.setAttribute("aria-label", "Esforço da NOVA IA");
    thumb?.setAttribute("aria-valuetext", selected.label);
  }, [selected.label]);

  return (
    <div className={`effort-card effort-card-${selected.theme}`}>
      <div className="effort-card-head">
        <Zap aria-hidden="true" className="effort-bolt" />
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="effort-trigger" aria-label={`Selecionar esforço: ${selected.label}`}>
              <span className="effort-title">{selected.label}<ChevronRight aria-hidden="true" size={20} /></span>
              <span className="effort-model">{MODEL_NAME}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="center" className={`effort-menu effort-menu-${selected.theme}`}>
            <p className="effort-menu-title">Selecionar esforço</p>
            <RadioGroup value={value} onValueChange={(next) => { if (isEffortLevel(next)) onChange(next); }} aria-label="Nível de esforço">
              {EFFORT_LEVELS.map((level) => (
                <label key={level.id} htmlFor={`${id}-${level.id}`} className={`effort-option ${value === level.id ? "selected" : ""}`}>
                  <RadioGroupItem id={`${id}-${level.id}`} value={level.id} />
                  <span><strong>{level.label}</strong><small>{level.description}</small></span>
                </label>
              ))}
            </RadioGroup>
          </PopoverContent>
        </Popover>
        <button type="button" className="effort-reset" onClick={() => onChange(DEFAULT_EFFORT)} aria-label="Restaurar esforço padrão" title="Restaurar esforço padrão">
          <RotateCcw aria-hidden="true" size={21} />
        </button>
      </div>
      <div className="effort-slider-wrap">
        <div className="effort-dots" aria-hidden="true">{EFFORT_LEVELS.map((level, i) => <i key={level.id} className={i <= index ? "reached" : ""} />)}</div>
        <Slider ref={sliderRef} className="effort-slider" value={[index]} min={0} max={4} step={1} onValueChange={([next]) => { const level = EFFORT_LEVELS[next ?? 2]; if (level) onChange(level.id); }} />
      </div>
      <div className="effort-scale" aria-hidden="true"><span>Mínimo</span><span>Máximo</span></div>
    </div>
  );
}
