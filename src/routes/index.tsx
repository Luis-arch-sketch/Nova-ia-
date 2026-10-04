import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MODEL_NAME, reply } from "@/lib/nova-engine";

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

type Msg = { role: "user" | "assistant"; text: string };
type Conv = { id: string; title: string; messages: Msg[] };

const SUGGESTIONS = [
  { t: "Ideias criativas", p: "Me dê ideias para um projeto de fim de semana" },
  { t: "Explicar um termo", p: "O que significa curiosidade?" },
  { t: "Planejar o dia", p: "Me ajude a organizar minha rotina de estudos" },
  { t: "Bater papo", p: "Vamos conversar sobre o espaço e as galáxias" },
];

const KEY = "nova-ia-conversas";
const newConv = (): Conv => ({ id: crypto.randomUUID(), title: "Nova conversa", messages: [] });

function Index() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [notice, setNotice] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let loaded: Conv[] = [];
    try { loaded = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch {}
    if (!loaded.length) loaded = [newConv()];
    setConvs(loaded);
    setActiveId(loaded[0]!.id);
  }, []);
  useEffect(() => { if (convs.length) localStorage.setItem(KEY, JSON.stringify(convs)); }, [convs]);
  const active = convs.find((c) => c.id === activeId);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.messages.length, typing]);

  const update = (id: string, fn: (c: Conv) => Conv) => setConvs((cs) => cs.map((c) => (c.id === id ? fn(c) : c)));

  const send = (text: string) => {
    const t = text.trim();
    if (!t || !active || typing) return;
    const id = active.id;
    update(id, (c) => ({
      ...c,
      title: c.messages.length ? c.title : t.slice(0, 36),
      messages: [...c.messages, { role: "user", text: t }],
    }));
    setInput("");
    setTyping(true);
    setTimeout(() => {
      update(id, (c) => ({ ...c, messages: [...c.messages, { role: "assistant", text: reply(t) }] }));
      setTyping(false);
    }, 600);
  };

  const create = () => { const c = newConv(); setConvs((cs) => [c, ...cs]); setActiveId(c.id); setSidebar(false); };
  const remove = (id: string) => {
    const rest = convs.filter((c) => c.id !== id);
    const list = rest.length ? rest : [newConv()];
    setConvs(list);
    if (id === activeId) setActiveId(list[0]!.id);
  };
  const soon = (what: string) => { setNotice(`${what}: em desenvolvimento`); setTimeout(() => setNotice(""), 2200); };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
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
          <span className="text-brand font-display font-semibold">Galaxy</span> · Modelo: <span className="text-foreground">{MODEL_NAME}</span>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <button className="rounded-lg px-2 py-1 text-xl md:hidden" aria-label="Abrir menu" onClick={() => setSidebar(true)}>☰</button>
          <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-primary glow" />
            <span className="font-medium">{MODEL_NAME}</span>
          </div>
          <span className="rounded-full border px-2.5 py-1 font-display text-[10px] tracking-widest text-brand">GALAXY</span>
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
                {active.messages.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground">{m.text}</div>
                    </div>
                  ) : (
                    <div key={i} className="flex gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand font-display text-xs font-bold text-primary-foreground">N</div>
                      <div className="pt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmt(m.text) }} />
                    </div>
                  ),
                )}
                {typing && <div className="flex gap-3 text-muted-foreground"><div className="h-8 w-8 animate-pulse rounded-lg bg-brand" /><span className="pt-1">NOVA IA está pensando…</span></div>}
                <div ref={endRef} />
              </div>
            )}
          </div>
        </section>

        <footer className="px-3 pb-3 md:px-4 md:pb-4">
          <div className="mx-auto max-w-3xl">
            {notice && <div className="mb-2 text-center text-sm text-accent">{notice}</div>}
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="rounded-2xl glass p-2 focus-within:border-primary">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                rows={1}
                placeholder="Envie uma mensagem para a NOVA IA"
                className="max-h-40 w-full resize-none bg-transparent px-2 py-2 outline-none placeholder:text-muted-foreground"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {["Criar imagem", "Criar vídeo", "Página web"].map((a) => (
                  <button key={a} type="button" onClick={() => soon(a)} className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">{a} <span className="text-accent">· em breve</span></button>
                ))}
                <span className="ml-auto hidden rounded-full bg-secondary px-3 py-1 text-xs sm:inline">{MODEL_NAME}</span>
                <button type="submit" disabled={!input.trim() || typing} aria-label="Enviar" className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-brand text-primary-foreground disabled:opacity-40 sm:ml-0">↑</button>
              </div>
            </form>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">{MODEL_NAME} · versão de demonstração local · Galaxy</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function fmt(t: string) {
  const esc = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}