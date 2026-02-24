export default async function handler(req, res) {
  const allowedOrigins = [
    "https://clickbackdrops.com",
    "https://staging.clickbackdrops.com"
  ];

  const origin = req.headers.origin || "";
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { TAVUS_API_KEY, TAVUS_PERSONA_ID, TAVUS_REPLICA_ID } = process.env;

  const tavusPayload = {
    replica_id: TAVUS_REPLICA_ID,
    persona_id: TAVUS_PERSONA_ID,
    require_auth: true,
    properties: {
      max_call_duration: 600,
      apply_greenscreen: true
    }
  };

  const r = await fetch("https://tavusapi.com/v2/conversations", {
    method: "POST",
    headers: {
      "x-api-key": TAVUS_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(tavusPayload)
  });

  const data = await r.json();

  if (!r.ok) {
    return res.status(r.status).json(data);
  }

  return res.status(200).json({
    conversation_url: data.conversation_url,
    meeting_token: data.meeting_token
  });
}
