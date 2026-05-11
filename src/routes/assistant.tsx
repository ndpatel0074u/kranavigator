import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { Sparkles, Send, Bot, User2, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { askAssistant } from "@/lib/assistant.functions";
import { useKraStore } from "@/store/kraStore";

export const Route = createFileRoute("/assistant")({
  component: AssistantPage,
  head: () => ({ meta: [{ title: "KRA Co-pilot — AI Assistant" }] }),
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Which objectives are lagging behind plan?",
  "Summarise progress for Sandeep Jain (SJ).",
  "Compare Q3 vs Q4 actuals across P&L Delivery KRAs.",
  "Which KRAs are below 50% progress and what risks should I flag?",
];

function AssistantPage() {
  const { kras } = useKraStore();
  const ask = useServerFn(askAssistant);

  const context = useMemo(
    () =>
      JSON.stringify(
        kras.map((k) => ({
          id: k.id,
          objective: k.objective,
          subObjective: k.subObjective,
          description: k.description,
          uom: k.uom,
          target: k.target,
          actual: k.actuals.at(-1)?.actual ?? null,
          progress: k.progress,
          weight: k.weight,
          status: k.status,
          timeFrame: k.timeFrame,
          cascadedTo: k.cascadedTo,
          actuals: k.actuals.map((a) => ({ period: a.period, actual: a.actual, progress: a.progress })),
        }))
      ),
    [kras]
  );

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await ask({ data: { messages: next, context } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: `Sorry — request failed. ${(e as Error).message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> KRA Co-pilot
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Ask anything about your KRAs</h1>
          <p className="text-muted-foreground">
            Grounded on {kras.length} live KRAs across all objectives, sub-objectives and cascaded leaders.
          </p>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-primary-foreground shadow-[var(--shadow-glow)]"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Bot className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold">How can I help review progress?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Try one of these prompts:</p>
              </div>
              <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-border bg-background px-4 py-3 text-left text-sm transition hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border/60 p-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about progress, risks, owners, trends…"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Send className="h-4 w-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary-foreground`}
        style={{ background: isUser ? "var(--gradient-magenta)" : "var(--gradient-primary)" }}
      >
        {isUser ? <User2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser ? "bg-secondary" : "border border-border bg-background"
        }`}
      >
        <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-table:my-2 prose-th:px-2 prose-td:px-2 prose-td:py-1 prose-headings:my-2">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}