const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");
let sharp = null;
try { sharp = require("sharp"); } catch (_) {}

const rootDir = path.resolve(__dirname, "..");
const siteDir = process.env.SITE_DIR || path.join(rootDir, "site");
const dataDir = process.env.DATA_DIR || path.join(rootDir, "data");
const uploadDir = path.join(siteDir, "uploads");
const contentFile = path.join(dataDir, "content.json");
const defaultContentFile = path.join(__dirname, "default-content.json");
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD || "";
const sessions = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function ensureStorage() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(contentFile)) {
    fs.copyFileSync(defaultContentFile, contentFile);
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function send(res, status, body, contentType = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload), "application/json; charset=utf-8");
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function isAuthed(req) {
  const token = parseCookies(req).md_session;
  return Boolean(token && sessions.has(token));
}

function requireAuth(req, res) {
  if (isAuthed(req)) return true;
  sendJson(res, 401, { error: "Connexion requise" });
  return false;
}

function readBody(req, maxBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Payload trop volumineux"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      let raw = Buffer.concat(chunks).toString("utf8");
      // Strip BOM and trim whitespace that breaks JSON.parse
      raw = raw.replace(/^\uFEFF/, "").trim();
      resolve(raw);
    });
    req.on("error", reject);
  });
}

function safeUploadName(name) {
  const base = String(name || "image")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
  return `${base || "image"}-${Date.now()}.webp`;
}

function serveFile(res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      send(res, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const immutable = /\.(?:css|js|png|jpe?g|webp|svg|ico)$/i.test(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": immutable ? "public, max-age=604800, immutable" : "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/content" && req.method === "GET") {
    sendJson(res, 200, readJson(contentFile));
    return;
  }

  if (url.pathname === "/api/session" && req.method === "GET") {
    sendJson(res, 200, {
      authenticated: isAuthed(req),
      configured: Boolean(adminPassword)
    });
    return;
  }

  if (url.pathname === "/api/login" && req.method === "POST") {
    let rawBody = await readBody(req); try { var body = JSON.parse(rawBody); } catch (e) { console.error("JSON parse failed:", rawBody.substring(0,200)); throw e; }
    if (!adminPassword) {
      sendJson(res, 503, { error: "ADMIN_PASSWORD doit Ãªtre dÃ©fini dans le .env serveur" });
      return;
    }
    if (body.password !== adminPassword) {
      sendJson(res, 403, { error: "Mot de passe incorrect" });
      return;
    }
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, Date.now());
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `md_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`
    });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname === "/api/logout" && req.method === "POST") {
    const token = parseCookies(req).md_session;
    if (token) sessions.delete(token);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "md_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"
    });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname === "/api/content" && req.method === "POST") {
    if (!requireAuth(req, res)) return;
    let rawBody = await readBody(req); try { var body = JSON.parse(rawBody); } catch (e) { console.error("JSON parse failed:", rawBody.substring(0,200)); throw e; }
    fs.writeFileSync(contentFile, `${JSON.stringify(body, null, 2)}\n`, "utf8");
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/upload" && req.method === "POST") {
    if (!requireAuth(req, res)) return;
    const ct = req.headers["content-type"] || "";
    
    if (ct.includes("application/json")) {
      const rawBody = await readBody(req, 50 * 1024 * 1024);
      const body = JSON.parse(rawBody);
      const match = String(body.dataUrl || "").match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) { sendJson(res, 400, { error: "Image base64 attendue" }); return; }
      const mime = match[1];
      const ext = mime.includes("png") ? ".png" : mime.includes("jpeg") ? ".jpg" : ".webp";
      let buffer = Buffer.from(match[2], "base64");
      if (sharp) { try { buffer = await sharp(buffer).webp({ quality: 85, effort: 4 }).toBuffer(); } catch (e) {} }
      const fn = safeUploadName(body.name || "image");
      fs.writeFileSync(path.join(uploadDir, fn), buffer);
      sendJson(res, 200, { path: "./uploads/" + fn });
      return;
    }
    
    // Raw binary upload
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let buffer = Buffer.concat(chunks);
    if (sharp) { try { buffer = await sharp(buffer).webp({ quality: 85, effort: 4 }).toBuffer(); } catch (e) {} }
    const fn = safeUploadName("image");
    fs.writeFileSync(path.join(uploadDir, fn), buffer);
    sendJson(res, 200, { path: "./uploads/" + fn });
    return;
  }

    sendJson(res, 404, { error: "API introuvable" });
}

ensureStorage();

http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url);
        return;
      }

      let requestedPath = decodeURIComponent(url.pathname);
      if (requestedPath === "/admin") requestedPath = "/admin/index.html";
      if (requestedPath === "/") requestedPath = "/index.html";

      const filePath = path.resolve(siteDir, `.${requestedPath}`);
      if (!filePath.startsWith(path.resolve(siteDir))) {
        send(res, 403, "Forbidden", "text/plain; charset=utf-8");
        return;
      }

      if (fs.existsSync(filePath)) {
        serveFile(res, filePath);
        return;
      }

      serveFile(res, path.join(siteDir, "index.html"));
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: "Erreur serveur" });
    }
  })
  .listen(port, () => {
    console.log(`Maison Dune server listening on ${port}`);
  });
