// Server-only: Kisan Assistant chat (streamed). Uses Google Gemini when GEMINI_API_KEY is set (e.g. Vercel),
// otherwise falls back to the Lovable AI Gateway (LOVABLE_API_KEY) inside Lovable.
const RUN = "X-Lovable-AIG-Run-ID";
const MODEL = "gemini-2.5-flash";

async function verifyUser(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const url = process.env["SUPABASE_URL"]; const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!token || !url || !key) return false;
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  return r.ok;
}

const SYSTEM = `You are "Kisan Sahayak", the FreshGrid FPO & agri-expert assistant for Indian smallholder farmers.
- Reply in the user's language: Hindi (Devanagari) if they write Hindi/Hinglish, else simple English with key terms also in Hindi in brackets.
- Be practical and short (under 180 words) with bullet points. Use ₹ and kg.
- You know post-harvest handling, cold storage temperatures, grading (A export/retail, B local retail, C processing), e-NAM, Agmarknet, PM-Kisan, KCC, UPI.
- Use the FARMER CONTEXT below (their real scans, bookings, lots, nearby cold rooms, live mandi prices) when relevant. Never invent numbers not in the context; say when data is unavailable.
- FreshGrid payments in this app are test payments (no real money moves yet) — say so if asked about real payouts.`;

export async function handleChat(request: Request) {
  if (!(await verifyUser(request))) return Response.json({ error: "Please sign in again." }, { status: 401 });
  const gemini = process.env["GEMINI_API_KEY"];
  if (gemini) return geminiChat(request, gemini);
  const lovable = process.env["LOVABLE_API_KEY"];
  if (lovable) return gatewayChat(request, lovable);
  return Response.json({ error: "Kisan Assistant is not set up yet: the GEMINI_API_KEY environment variable is missing on the server." }, { status: 500 });
}

async function geminiChat(request: Request, apiKey: string) {
  let body: { messages?: { role: string; content: string }[]; context?: string };
  try { body = await request.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  const msgs = (body.messages ?? []).filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim()).slice(-20)
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content.slice(0, 2000) }] }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift(); // Gemini needs the first turn to be the user
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return Response.json({ error: "Empty message" }, { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse`, {
      method: "POST", signal: request.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `${SYSTEM}\n\nFARMER CONTEXT:\n${(body.context ?? "").slice(0, 6000)}` }] },
        contents: msgs,
      }),
    });
  } catch (e) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    throw e;
  }
  if (!upstream.ok || !upstream.body) {
    let msg = "The assistant is unavailable right now.";
    if (upstream.status === 429) msg = "Too many requests (Gemini free-tier limit) — please wait a moment and try again.";
    try {
      const j = (await upstream.json()) as { error?: { message?: string } };
      if (upstream.status === 400 || upstream.status === 401 || upstream.status === 403) msg = `Gemini error: ${j.error?.message ?? "the API key was rejected."}`;
    } catch { /* ignore */ }
    return Response.json({ error: msg }, { status: upstream.status });
  }
  // Convert Gemini SSE into a plain text stream of answer deltas.
  const dec = new TextDecoder(); const enc = new TextEncoder(); let buf = "";
  const handle = (line: string, ctrl: TransformStreamDefaultController<Uint8Array>) => {
    if (!line.startsWith("data:")) return;
    const d = line.slice(5).trim(); if (!d) return;
    try {
      const ev = JSON.parse(d) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } };
      const c = ev.candidates?.[0];
      for (const part of c?.content?.parts ?? []) if (part.text && !part.thought) ctrl.enqueue(enc.encode(part.text));
      if (ev.promptFeedback?.blockReason || c?.finishReason === "SAFETY") ctrl.enqueue(enc.encode("\n\n⚠ The assistant could not answer this question."));
    } catch { /* partial */ }
  };
  const out = upstream.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, ctrl) {
      buf += dec.decode(chunk, { stream: true }).replace(/\r\n/g, "\n");
      let i;
      while ((i = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); handle(line, ctrl); }
    },
    flush(ctrl) { if (buf) handle(buf, ctrl); },
  }));
  return new Response(out, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
}

async function gatewayChat(request: Request, apiKey: string) {
  let body: { messages?: { role: string; content: string }[]; context?: string };
  try { body = await request.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  const msgs = (body.messages ?? []).filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!msgs.length) return Response.json({ error: "Empty message" }, { status: 400 });
  const input = [{ role: "system", content: `${SYSTEM}\n\nFARMER CONTEXT:\n${(body.context ?? "").slice(0, 6000)}` }, ...msgs];

  const runId = request.headers.get(RUN)?.trim();
  let upstream: Response;
  try {
    upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST", signal: request.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch", ...(runId ? { [RUN]: runId } : {}) },
      body: JSON.stringify({ model: "openai/gpt-6-astra", input, stream: true, store: false, reasoning: { effort: "low", summary: "auto" }, include: ["reasoning.encrypted_content"] }),
    });
  } catch (e) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    throw e;
  }
  if (!upstream.ok || !upstream.body) {
    let msg = "The assistant is unavailable right now.";
    if (upstream.status === 429) msg = "Too many requests — please wait a moment and try again.";
    if (upstream.status === 402) msg = "AI credits are used up for this workspace. The app owner needs to add credits.";
    try { const j = (await upstream.json()) as { error?: { message?: string }; message?: string }; if (upstream.status === 403) msg = j.error?.message ?? j.message ?? msg; } catch { /* ignore */ }
    return Response.json({ error: msg }, { status: upstream.status });
  }
  // Convert SSE into a plain text stream of answer deltas.
  const dec = new TextDecoder(); const enc = new TextEncoder(); let buf = "";
  const out = upstream.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, ctrl) {
      buf += dec.decode(chunk, { stream: true });
      let i;
      while ((i = buf.indexOf("\n\n")) >= 0) {
        const frame = buf.slice(0, i); buf = buf.slice(i + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const d = line.slice(5).trim(); if (!d || d === "[DONE]") continue;
          try {
            const ev = JSON.parse(d) as { type?: string; delta?: string; response?: { error?: { message?: string } } };
            if (ev.type === "response.output_text.delta" && ev.delta) ctrl.enqueue(enc.encode(ev.delta));
            if (ev.type === "response.failed" || ev.type === "error") ctrl.enqueue(enc.encode("\n\n⚠ " + (ev.response?.error?.message ?? "The assistant stopped unexpectedly.")));
          } catch { /* partial */ }
        }
      }
    },
  }));
  const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" });
  upstream.headers.forEach((v, k) => { if (k.toLowerCase().startsWith("x-lovable-aig-")) headers.set(k, v); });
  return new Response(out, { headers });
}
