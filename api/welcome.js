const axios = require("axios");
const sharp = require("sharp");

/**
 * Default templates (jika tidak ada templateUrl)
 */
const DEFAULT_TEMPLATES = [
  "Selamat datang, {name}! Selamat bergabung di {group}. Kamu member ke-{count}.",
  "Halo {name} \nWelcome to {group} — semoga betah! (Member #{count})",
  "Wes mlebu, {name}! Jangan lupa baca rules {group}. Total anggota: {count}",
  "Hai {name}! Selamat datang di {group}. Have fun!  (Anggota: {count})",
];

/**
 * Ambil template dari URL jika ada
 */
async function loadTemplates(templateUrl) {
  if (!templateUrl) return DEFAULT_TEMPLATES;
  try {
    const res = await axios.get(templateUrl, { timeout: 10000 });
    if (Array.isArray(res.data) && res.data.length) return res.data;
    if (res.data && Array.isArray(res.data.templates)) return res.data.templates;
    return DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

/**
 * Ganti placeholder template
 */
function fillTemplate(tpl, { name = "Teman", group = "Grup", count = "?" } = {}) {
  return String(tpl)
    .replace(/\{name\}/gi, name)
    .replace(/\{group\}/gi, group)
    .replace(/\{count\}/gi, String(count));
}

/**
 * Generate gambar welcome pakai Sharp
 */
function sanitizeSVGText(str) {
  if (!str) return "";
  return String(str)
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, "") // hapus karakter tidak valid
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function generateWelcomeImage({ name, group, count, avatarUrl, bgUrl }) {
  const width = 900;
  const height = 450;

  // ambil background
  let bgBuffer;
  try {
    const bgResp = await axios.get(bgUrl, { responseType: "arraybuffer" });
    bgBuffer = Buffer.from(bgResp.data);
  } catch {
    const svgFallback = `
      <svg width="${width}" height="${height}">
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1f2937"/>
          <stop offset="100%" stop-color="#0ea5a4"/>
        </linearGradient>
        <rect width="100%" height="100%" fill="url(#grad)"/>
      </svg>`;
    bgBuffer = Buffer.from(svgFallback);
  }

  // ambil avatar
  let avatarBuffer = null;
  try {
    const avatarResp = await axios.get(avatarUrl, { responseType: "arraybuffer" });
    avatarBuffer = await sharp(Buffer.from(avatarResp.data))
      .resize(180, 180)
      .png()
      .toBuffer();
  } catch {
    avatarBuffer = await sharp({
      create: {
        width: 180,
        height: 180,
        channels: 3,
        background: "#374151",
      },
    }).png().toBuffer();
  }

  // sanitasi teks sebelum masuk SVG
  const safeName = sanitizeSVGText(name);
  const safeGroup = sanitizeSVGText(group);
  const safeCount = sanitizeSVGText(count);

  // SVG overlay
  const svgOverlay = `
  <svg width="${width}" height="${height}">
    <style>
      .group { fill: white; font: bold 36px 'Sans'; }
      .welcome { fill: white; font: bold 28px 'Sans'; }
      .name { fill: #fffbeb; font: bold 32px 'Sans'; }
      .count { fill: #e5e7eb; font: 18px 'Sans'; }
      .footer { fill: #cbd5e1; font: 14px 'Sans'; }
    </style>
    <text x="250" y="120" class="group">${safeGroup}</text>
    <text x="250" y="170" class="welcome">Selamat datang,</text>
    <text x="250" y="215" class="name">${safeName}</text>
    <text x="250" y="260" class="count">Kamu member ke-${safeCount}</text>
    <rect x="0" y="${height - 60}" width="${width}" height="60" fill="rgba(255,255,255,0.06)"/>
    <text x="20" y="${height - 25}" class="footer">Selamat bergabung! Baca rules dan perkenalkan diri ya </text>
  </svg>`;

  const final = await sharp(bgBuffer)
    .resize(width, height)
    .composite([
      { input: avatarBuffer, top: 130, left: 40 },
      { input: Buffer.from(svgOverlay), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  return final;
}

/**
 * Export API endpoint
 */
module.exports = {
  name: "Welcome Sharp",
  desc: "Generate welcome image/text menggunakan module Sharp",
  category: "Utility",
  path: "/welcome?apikey=&name=&group=&count=&avatar=&templateUrl=&bg=",

  async run(req, res) {
    try {
      const { apikey, name, group = "Group", count = "?", avatar, templateUrl, bg } = req.query;

      if (!apikey || !global.apikey?.includes(apikey))
        return res.status(401).json({ status: false, error: "Apikey invalid" });

      if (!name)
        return res.status(400).json({ status: false, error: "Parameter 'name' diperlukan" });

      const templates = await loadTemplates(templateUrl);
      const tpl = templates[Math.floor(Math.random() * templates.length)];
      const text = fillTemplate(tpl, { name, group, count });

      // hasilkan gambar
      try {
        const buffer = await generateWelcomeImage({
          name,
          group,
          count,
          avatarUrl: avatar,
          bgUrl: bg,
        });
        res.setHeader("Content-Type", "image/png");
        res.setHeader("X-Welcome-Text", encodeURIComponent(text));
        return res.send(buffer);
      } catch (e) {
        return res.json({ status: true, text, note: "Gagal membuat gambar", error: e.message });
      }
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message || "Internal Server Error" });
    }
  },
};
