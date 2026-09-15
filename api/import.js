import dns from "node:dns/promises";
import net from "node:net";

function isPrivateIp(ip) {
  const type = net.isIP(ip);
  if (type === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168);
  }
  if (type === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("::ffff:")) return isPrivateIp(lower.slice(7));
    return lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd");
  }
  return true;
}

async function assertPublicHostname(hostname) {
  if (hostname === "localhost") throw new Error("private host");
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("private host");
    return;
  }
  const records = await dns.lookup(hostname, { all: true });
  if (records.some((r) => isPrivateIp(r.address))) throw new Error("private host");
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = req.method === "GET" ? req.query.url : req.body?.url;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL required" });
  }

  let target;
  try {
    target = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    await assertPublicHostname(target.hostname);
  } catch {
    return res.status(400).json({ error: "That URL can't be fetched" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      return res.status(422).json({ error: `Failed to fetch page (${response.status})` });
    }
    const html = await response.text();
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ html });
  } catch {
    return res.status(422).json({ error: "Failed to fetch page" });
  } finally {
    clearTimeout(timer);
  }
}
