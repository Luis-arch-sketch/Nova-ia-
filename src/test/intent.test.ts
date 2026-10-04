import { describe, expect, it } from "vitest";
import { classifyIntent } from "@/lib/intent";
import { reply } from "@/lib/nova-engine";

describe("classifyIntent", () => {
  it.each(["casa", "curiosidade", "amor", "jogo", "Casa?", "  amor  ", "galáxia!"])(
    "palavra isolada '%s' nunca é definição",
    (w) => {
      expect(classifyIntent(w).kind).not.toBe("definition");
      expect(reply(w)).not.toMatch(/significa\.\.\.|^\*\*/);
    },
  );

  it.each([
    ["o que significa casa?", "casa"],
    ["qual o significado de amor?", "amor"],
    ["defina curiosidade", "curiosidade"],
    ["o que é jogo?", "jogo"],
    ["O que quer dizer galáxia?", "galaxia"],
  ])("'%s' é definição de %s", (q, term) => {
    expect(classifyIntent(q)).toEqual({ kind: "definition", term });
  });

  it("frases comuns são conversa", () => {
    expect(classifyIntent("eu gosto da minha casa").kind).toBe("chat");
    expect(classifyIntent("o que é que você acha disso tudo hoje à noite?").kind).toBe("chat");
  });
});