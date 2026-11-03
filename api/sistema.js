// Servidor do "sistema": recebe as mensagens do app e chama a API da Anthropic.
// Variáveis de ambiente (configure no painel da Vercel):
//   ANTHROPIC_API_KEY  -> sua chave da API (console.anthropic.com)
//   APP_TOKEN          -> uma senha que você inventa; a mesma vai no app
//   MODEL_DEFAULT      -> opcional, padrão claude-sonnet-5-5
//   MODEL_QUICK        -> opcional, padrão claude-haiku-5-5
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-app-token");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "use POST" });

  const token = process.env.APP_TOKEN;
  if (!token || req.headers["x-app-token"] !== token) return res.status(401).json({ error: "senha do app incorreta" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { messages, tier } = body;
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: "messages vazio" });
  if (JSON.stringify(messages).length > 60000) return res.status(413).json({ error: "mensagem grande demais" });

  const model = tier === "quick"
    ? (process.env.MODEL_QUICK || "claude-haiku-5-5")
    : (process.env.MODEL_DEFAULT || "claude-sonnet-5-5");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        messages: messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content) }))
      })
    });
    if (r.status === 429) return res.status(429).json({ error: "limite da API" });
    if (!r.ok) return res.status(502).json({ error: "erro na API", detail: (await r.text()).slice(0, 500) });
    const d = await r.json();
    const text = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: "falha ao chamar a API" });
  }
};
