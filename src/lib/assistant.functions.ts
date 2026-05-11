import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { messages: Msg[]; context: string };
    if (!d || !Array.isArray(d.messages)) throw new Error("messages required");
    return { messages: d.messages, context: String(d.context ?? "") };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        reply:
          "AI is not configured. Set LOVABLE_API_KEY to enable the assistant.",
      };
    }
    const system = `You are the KRA Co-pilot for the CEO of Adani Defence Systems.
Answer concisely, cite specific KRA codes (e.g. KRA-002), objectives, sub-objectives, owners, and progress %.
Use markdown tables when comparing multiple KRAs. Be direct and analytical.

# Live KRA dataset (JSON)
${data.context}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...data.messages],
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { reply: `Assistant error (${resp.status}): ${text.slice(0, 200)}` };
    }
    const json = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content ?? "(no response)";
    return { reply };
  });