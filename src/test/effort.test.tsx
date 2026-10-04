import { useState, type ComponentType } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EffortSelector } from "@/components/effort-selector";
import { EFFORT_KEY, type EffortLevel } from "@/lib/effort";
import { generationSettings } from "@/lib/nova-engine";
import { Route } from "@/routes/index";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function Selector() {
  const [value, setValue] = useState<EffortLevel>("medio");
  return <EffortSelector value={value} onChange={setValue} />;
}

describe("Esforço da NOVA IA", () => {
  it("permite chegar ao máximo pela barra e restaurar o padrão", () => {
    render(<Selector />);
    const slider = screen.getByRole("slider", { name: "Esforço da NOVA IA" });
    fireEvent.keyDown(slider, { key: "End" });
    expect(screen.getByRole("button", { name: "Selecionar esforço: Máximo" })).toBeInTheDocument();
    expect(slider).toHaveAttribute("aria-valuetext", "Máximo");
    fireEvent.click(screen.getByRole("button", { name: "Restaurar esforço padrão" }));
    expect(screen.getByRole("button", { name: "Selecionar esforço: Médio" })).toBeInTheDocument();
    expect(slider).toHaveAttribute("aria-valuenow", "2");
  });

  it("abre os cinco níveis e permite selecionar Máximo", () => {
    render(<Selector />);
    fireEvent.click(screen.getByRole("button", { name: "Selecionar esforço: Médio" }));
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    fireEvent.click(screen.getByRole("radio", { name: /Máximo/ }));
    expect(screen.getByRole("button", { name: "Selecionar esforço: Máximo" })).toBeInTheDocument();
  });

  it("destina mais geração ao esforço máximo", () => {
    expect(generationSettings("maximo").max_new_tokens).toBeGreaterThan(generationSettings("minimo").max_new_tokens);
  });

  it("restaura o nível salvo e mantém o visual coerente ao alterar e reabrir", () => {
    const Homepage = Route.options.component as ComponentType;
    localStorage.setItem(EFFORT_KEY, "maximo");
    render(<Homepage />);
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Abrir opções da NOVA IA" }));
    expect(screen.getByRole("button", { name: "Selecionar esforço: Máximo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usar tema GALAXY" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Restaurar esforço padrão" }));
    expect(screen.getByRole("button", { name: "Usar tema LÍQUIDO AZUL" })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem(EFFORT_KEY)).toBe("medio");
    fireEvent.click(screen.getByRole("button", { name: "Fechar opções" }));
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    cleanup();
    render(<Homepage />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir opções da NOVA IA" }));
    expect(screen.getByRole("button", { name: "Selecionar esforço: Médio" })).toBeInTheDocument();
  });
});
