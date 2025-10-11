const axios = require("axios");
const Canvas = (() => {
  try {
    return require("canvas");
  } catch {
    return null;
  }
})();
const fetch = require("node-fetch");

/** Default templates **/
const DEFAULT_TEMPLATES = [
  " Selamat datang, {name}! Selamat bergabung di {group}. Kamu member ke-{count}.",
  " Halo {name}, selamat datang di {group}! Semoga betah ya~ (Anggota #{count})",
  " {name} baru saja masuk ke {group}! Jangan lupa baca peraturan, member #{count}.",
  " Hai {name}! Welcome di {group}. Semoga hari kamu menyenangkan~ (#{count})",
];

/** Ambil template dari URL remote **/
async function loadTemplates(templateUrl) {
  if (!templateUrl) return DEFAULT_TEMPLATES;
  try {
    const res = await axios.get(templateUrl, { timeout: 10000 });
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.templates)) return res.data.templates;
    if (typeof res.data === "string") return [res.data];
    return DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

/** Ganti placeholder di template **/
function fillTemplate(tpl, { name = "Teman", group = "Group", count = "?" } = {}) {
  return String(tpl)
    .replace(/\{name\}/gi, name)
    .replace(/\{group\}/gi, group)
    .replace(/\{count\}/gi, String(count));
}

/** Generate gambar welcome **/
async function generateWelcomeImage({ name, group, count, avatarUrl, bgUrl }) {
  if (!Canvas) throw new Error("Canvas not available in this environment");
  const { createCanvas, loadImage } = Canvas;

  const width = 900, height = 450;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  try {
    const bg = bgUrl ? await loadImage(bgUrl) : null;
    if (bg) ctx.drawImage(bg, 0, 0, width, height);
    else {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#111827");
      grad.addColorStop(1, "#0f766e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
  } catch {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);
  }

  // Avatar
  const size = 180, x = 70, y = (height - size) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  try {
    if (avatarUrl) {
      const avatar = await loadImage(avatarUrl);
      ctx.drawImage(avatar, x, y, size, size);
    } else {
      ctx.fillStyle = "#334155";
      ctx.fillRect(x, y, size, size);
    }
  } catch {
    ctx.fillStyle = "#334155";
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();

  // Text
  const textX = x + size + 50;
  const textY = y + 40;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 40px Sans";
  ctx.fillText("Selamat Datang!", textX, textY);
  ctx.font = "32px Sans";
  ctx.fillText(name, textX, textY + 50);
  ctx.font = "24px Sans";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(`Di ${group}`, textX, textY + 90);
  ctx.font = "20px Sans";
  ctx.fillStyle = "#a1a1aa";
  ctx.fillText(`Kamu member ke-${count}`, textX, textY + 130);

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(0, height - 60, width, 60);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "16px Sans";
  ctx.fillText(" Selamat bergabung di keluarga baru! ", 20, height - 25);

  return canvas.toBuffer("image/png");
}

/** Main API **/
module.exports = {
  name: "Welcome Scrape",
  desc: "Generate pesan/gambar welcome (template bisa dari URL remote)",
  category: "Utility",
  path: "/welcome?apikey=&name=&group=&count=&avatar=&templateUrl=&bg=",

  async run(req, res) {
    try {
      const { apikey, name, group = "Group", count = "?", avatar, templateUrl, bg } = req.query;

      if (!apikey || !global.apikey?.includes(apikey))
        return res.status(401).json({ status: false, error: "Apikey invalid" });
      if (!name)
        return res.status(400).json({ status: false, error: "Parameter 'name' diperlukan" });

      // Ambil template
      const templates = await loadTemplates(templateUrl);
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      const text = fillTemplate(randomTemplate, { name, group, count });

      // Generate gambar jika bisa
      if (Canvas) {
        try {
          const buffer = await generateWelcomeImage({ name, group, count, avatarUrl: avatar, bgUrl: bg });
          res.setHeader("Content-Type", "image/png");
          res.setHeader("X-Welcome-Text", encodeURIComponent(text));
          return res.send(buffer);
        } catch (err) {
          return res.json({ status: true, text, note: "Gagal membuat gambar", error: err.message });
        }
      }

      // Fallback text
      return res.json({ status: true, text });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  }
};
