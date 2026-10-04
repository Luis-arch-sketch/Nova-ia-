import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MODEL_NAME, type ChatMessage } from "@/lib/nova-engine";
import { NovaEngine } from "@/lib/nova-client";
import { ENGINE_ERROR, type EngineState } from "@/lib/nova-protocol";
import { ComposerMenu } from "@/components/composer-menu";
import { DEFAULT_EFFORT, EFFORT_KEY, EFFORT_LEVELS, effortIndex, isEffortLevel, type EffortLevel } from "@/lib/effort";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NOVA IA — Assistente Galaxy" },
      { name: "description", content: "Converse com a NOVA IA, assistente com visual futurista Galaxy." },
      { property: "og:title", content: "NOVA IA — Assistente Galaxy" },
      { property: "og:description", content: "Converse com a NOVA IA, assistente com visual futurista Galaxy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Conv = { id: string; title: string; messages: ChatMessage[] };
type FailedReply = { id: string; index: number; history: ChatMessage[]; message: string };

const SUGGESTIONS = [
  { t: "Ideias criativas", p: "Me dê ideias para um projeto de fim de semana" },
  { t: "Explicar um termo", p: "O que significa curiosidade?" },
  { t: "Planejar o dia", p: "Me ajude a organizar minha rotina de estudos" },
  { t: "Bater papo", p: "Vamos conversar sobre o espaço e as galáxias" },
];

const KEY = "nova-ia-conversas";
const THEME_KEY = "nova-ia-theme";
type ThemeMode = "galaxy" | "liquido";
const newConv = (): Conv => ({ id: crypto.randomUUID(), title: "Nova conversa", messages: [] });

function Index() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [engineState, setEngineState] = useState<EngineState>({ phase: "idle" });
  const [failedReply, setFailedReply] = useState<FailedReply | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [effort, setEffort] = useState<EffortLevel>(DEFAULT_EFFORT);
  const theme: ThemeMode = EFFORT_LEVELS[effortIndex(effort)]!.theme;
  const [themeReady, setThemeReady] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NovaEngine | null>(null);
  const requestRef = useRef<{ id: string; index: number } | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current = null;
      engineRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    let loaded: Conv[] = [];
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(stored)) loaded = stored.filter(isConversation);
    } catch {}
    if (!loaded.length) loaded = [newConv()];
    setConvs(loaded);
    setActiveId(loaded[0]!.id);
  }, []);
  useEffect(() => {
    try { if (convs.length) localStorage.setItem(KEY, JSON.stringify(convs)); } catch {}
  }, [convs]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      const savedEffort = localStorage.getItem(EFFORT_KEY);
      const restored = isEffortLevel(savedEffort) ? savedEffort : saved === "galaxy" ? "maximo" : DEFAULT_EFFORT;
      setEffort(restored);
    } catch {}
    setThemeReady(true);
  }, []);
  useEffect(() => {
    if (!themeReady) return;
    try {
      localStorage.setItem(THEME_KEY, theme);
      localStorage.setItem(EFFORT_KEY, effort);
    } catch {}
  }, [theme, effort, themeReady]);
  const active = convs.find((c) => c.id === activeId);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: typing ? "auto" : "smooth" }); }, [active?.messages.length, active?.messages.at(-1)?.text.length, typing]);

  const update = (id: string, fn: (c: Conv) => Conv) => setConvs((cs) => cs.map((c) => (c.id === id ? fn(c) : c)));
  const changeEffort = (next: EffortLevel) => {
    setEffort(next);
  };

  const run = async (id: string, history: ChatMessage[], index: number) => {
    if (requestRef.current) return;
    const job = { id, index };
    requestRef.current = job;
    setTyping(true);
    setRunningId(id);
    setFailedReply(null);
    const writeAnswer = (text: string) => {
      if (!mountedRef.current || requestRef.current !== job) return;
      update(id, (c) => ({ ...c, messages: c.messages.map((message, i) => i === index ? { role: "assistant", text } : message) }));
    };
    writeAnswer("");
    engineRef.current ??= new NovaEngine();
    try {
      const answer = await engineRef.current.generate(history, effort, {
        onState: (state) => { if (mountedRef.current && requestRef.current === job) setEngineState(state); },
        onText: writeAnswer,
      });
      writeAnswer(answer);
    } catch (error) {
      if (!mountedRef.current || requestRef.current !== job) return;
      setEngineState({ phase: "idle" });
      if (!(error instanceof Error && error.name === "AbortError")) setFailedReply({ id, index, history, message: ENGINE_ERROR });
    } finally {
      if (mountedRef.current && requestRef.current === job) {
        requestRef.current = null;
        setTyping(false);
        setRunningId(null);
      }
    }
  };

  const send = (text: string) => {
    const t = text.trim();
    if (!t || !active || requestRef.current) return;
    const id = active.id;
    const history: ChatMessage[] = [...active.messages.filter((m) => m.text.trim()), { role: "user", text: t }];
    update(id, (c) => ({
      ...c,
      title: c.messages.length ? c.title : t.slice(0, 36),
      messages: [...history, { role: "assistant", text: "" }],
    }));
    setInput("");
    void run(id, history, history.length);
  };

  const create = () => { const c = newConv(); setConvs((cs) => [c, ...cs]); setActiveId(c.id); setSidebar(false); };
  const remove = (id: string) => {
    if (requestRef.current?.id === id) engineRef.current?.cancel();
    const rest = convs.filter((c) => c.id !== id);
    const list = rest.length ? rest : [newConv()];
    setConvs(list);
    if (id === activeId) setActiveId(list[0]!.id);
  };

  return (
    <div className={`theme-shell ${theme === "liquido" ? "theme-liquido" : "theme-galaxy"} flex h-[100dvh] overflow-hidden`}>
      {sidebar && <div className="fixed inset-0 z-30 bg-background/70 md:hidden" onClick={() => setSidebar(false)} />}
      <aside className={`fixed z-40 flex h-full w-72 flex-col border-r bg-sidebar p-4 backdrop-blur-xl transition-transform md:static md:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-display text-sm font-bold text-primary-foreground glow">N</div>
          <span className="font-display text-lg font-bold tracking-widest text-brand">NOVA IA</span>
        </div>
        <button onClick={create} className="mb-4 rounded-xl bg-brand px-4 py-2.5 font-medium text-primary-foreground glow transition hover:opacity-90">+ Nova conversa</button>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Conversas</p>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {convs.map((c) => (
            <div key={c.id} className={`group flex items-center rounded-lg px-3 py-2 text-sm ${c.id === activeId ? "bg-secondary" : "hover:bg-secondary/60"}`}>
              <button className="flex-1 truncate text-left" onClick={() => { setActiveId(c.id); setSidebar(false); }}>{c.title}</button>
              <button aria-label="Excluir conversa" onClick={() => remove(c.id)} className="ml-2 text-muted-foreground opacity-60 hover:text-destructive md:opacity-0 md:group-hover:opacity-100">×</button>
            </div>
          ))}
        </nav>
        <div className="mt-4 rounded-xl glass p-3 text-xs text-muted-foreground">
          <span className="text-brand font-display font-semibold">{theme === "liquido" ? "Líquido Azul" : "Galaxy"}</span> · Modelo: <span className="text-foreground">{MODEL_NAME}</span>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="nova-header flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <button className="rounded-lg px-2 py-1 text-xl md:hidden" aria-label="Abrir menu" onClick={() => setSidebar(true)}>☰</button>
          <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-primary glow" />
            <span className="font-medium">{MODEL_NAME}</span>
          </div>
          <div className="theme-switcher" role="group" aria-label="Selecionar visual da NOVA IA">
            <button type="button" onClick={() => changeEffort(DEFAULT_EFFORT)} className={`theme-switcher-btn ${theme === "liquido" ? "active" : ""}`} aria-pressed={theme === "liquido"} aria-label="Usar tema LÍQUIDO AZUL">LÍQUIDO AZUL</button>
            <button type="button" onClick={() => changeEffort("maximo")} className={`theme-switcher-btn ${theme === "galaxy" ? "active" : ""}`} aria-pressed={theme === "galaxy"} aria-label="Usar tema GALAXY">GALAXY</button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-3xl">
            {!active?.messages.length ? (
              <div className="pt-6 text-center md:pt-16">
                <h1 className="font-display text-3xl font-bold tracking-wide md:text-5xl"><span className="text-brand">NOVA IA</span></h1>
                <p className="mt-3 text-muted-foreground">Olá! Sobre o que vamos conversar hoje?</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s.t} onClick={() => send(s.p)} className="rounded-2xl glass p-4 text-left transition hover:border-primary hover:glow">
                      <div className="font-medium text-primary">{s.t}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{s.p}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {active.messages.map((m, i) => !m.text ? null :
                  m.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground">{m.text}</div>
                    </div>
                  ) : (
                    <div key={i} className="flex gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand font-display text-xs font-bold text-primary-foreground">N</div>
                      <div className="min-w-0 flex-1 whitespace-pre-wrap break-words pt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmt(m.text) }} />
                    </div>
                  ),
                )}
                {typing && runningId === activeId && engineState.phase === "generating" && !active.messages.at(-1)?.text && <div className="flex gap-3 text-muted-foreground"><div className="h-8 w-8 animate-pulse rounded-lg bg-brand" /><span className="pt-1">NOVA IA está pensando…</span></div>}
                <div ref={endRef} />
              </div>
            )}
          </div>
        </section>

        <footer className="px-3 pb-3 md:px-4 md:pb-4">
          <div className="mx-auto max-w-3xl">
            {typing && (
              <div className="mb-2 rounded-xl glass px-3 py-2 text-sm text-muted-foreground">
                <p role="status">{engineState.phase === "loading"
                  ? engineState.stage === "download" ? `Baixando NOVA IA · ${engineState.progress ?? 0}%` : "Preparando NOVA IA no seu aparelho…"
                  : runningId === activeId ? "NOVA IA está respondendo…" : "NOVA IA está respondendo em outra conversa…"}</p>
                {engineState.phase === "loading" && engineState.progress !== null && <div className="ai-progress mt-2" role="progressbar" aria-label="Preparação da NOVA IA" aria-valuemin={0} aria-valuemax={100} aria-valuenow={engineState.progress}><span style={{ width: `${engineState.progress}%` }} /></div>}
              </div>
            )}
            {failedReply?.id === activeId && <div className="mb-2 rounded-xl glass p-3 text-sm" role="alert"><p>{failedReply.message}</p><button type="button" onClick={() => { void run(failedReply.id, failedReply.history, failedReply.index); }} className="mt-2 font-semibold text-primary">Tentar novamente</button></div>}
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="rounded-2xl glass p-2 focus-within:border-primary">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }}
                rows={1}
                maxLength={4000}
                aria-label="Mensagem para a NOVA IA"
                placeholder="Envie uma mensagem para a NOVA IA"
                className="max-h-40 w-full resize-none bg-transparent px-2 py-2 outline-none placeholder:text-muted-foreground"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <ComposerMenu effort={effort} onChange={changeEffort} />
                <span className="px-2 text-sm text-muted-foreground">Esforço: {EFFORT_LEVELS[effortIndex(effort)]!.label}</span>
                {typing ? <button type="button" onClick={() => engineRef.current?.cancel()} aria-label="Interromper resposta" className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-brand text-primary-foreground">■</button> : <button type="submit" disabled={!input.trim()} aria-label="Enviar" className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-brand text-primary-foreground disabled:opacity-40">↑</button>}
              </div>
            </form>
            <p className="mt-2 text-center text-[12px] text-muted-foreground">{MODEL_NAME} · grátis no seu aparelho · {theme === "liquido" ? "Líquido Azul" : "Galaxy"}</p>
            {engineState.phase === "idle" && !active?.messages.length && <p className="mt-1 text-center text-[12px] text-muted-foreground">O primeiro uso baixa cerca de 650 MB e salva o modelo no navegador.</p>}
          </div>
        </footer>
      </main>
    </div>
  );
}

function isConversation(value: unknown): value is Conv {
  if (!value || typeof value !== "object") return false;
  const c = value as Partial<Conv>;
  return typeof c.id === "string" && typeof c.title === "string" && Array.isArray(c.messages) && c.messages.every((m: unknown) => {
    if (!m || typeof m !== "object") return false;
    const message = m as Partial<ChatMessage>;
    return (message.role === "user" || message.role === "assistant") && typeof message.text === "string";
  });
}

function fmt(t: string) {
  const esc = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
