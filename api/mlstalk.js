const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Try multiple selectors until one returns text
 */
function firstText($, selectors) {
  for (const s of selectors) {
    const el = $(s);
    if (el && el.length) {
      const t = el.first().text().trim();
      if (t) return t;
    }
  }
  return null;
}

/**
 * Try multiple selectors until one returns attribute value
 */
function firstAttr($, selectors, attr = "src") {
  for (const s of selectors) {
    const el = $(s);
    if (el && el.length) {
      const v = el.first().attr(attr);
      if (v) return v;
    }
  }
  return null;
}

/**
 * Fetch profile HTML from known ML profile endpoints.
 * We attempt multiple possible URL patterns (common public sites).
 * You can add/remove sites as needed.
 */
async function fetchProfileHtml(uid) {
  const tries = [
    // mobilelegends official-ish mobile site (pattern may vary)
    `https://m.mobilelegends.com/profile?uid=${encodeURIComponent(uid)}`,
    // Another common third-party pattern (example)
    `https://www.mobilelegends.com/profile/${encodeURIComponent(uid)}`,
    // Stats site pattern (example)
    `https://m.mobilelegends.com/en/profile?uid=${encodeURIComponent(uid)}`,
    // fallback: search by uid on a popular stats domain (may 404)
    `https://www.mlstalk.net/profile/${encodeURIComponent(uid)}`,
  ];

  let lastErr = null;
  for (const url of tries) {
    try {
      const resp = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ML-Stalk/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
        timeout: 10000,
      });
      // only return if status 200 and html exists
      if (resp.status === 200 && resp.data) return { html: resp.data, url };
    } catch (e) {
      lastErr = e;
      // continue trying other sites
    }
  }
  // jika semua gagal, lempar error terakhir
  throw lastErr || new Error("No available profile endpoints");
}

/**
 * Parse HTML to extract probable fields.
 * Karena setiap situs beda struktur, kita coba beberapa selector umum.
 */
function parseProfile(html, sourceUrl) {
  const $ = cheerio.load(html);

  // Probable selectors for nickname
  const nickname = firstText($, [
    ".player-name",
    ".profile-name",
    ".nick",
    "h1.profile-title",
    "h1.title",
    ".hero-profile__name",
  ]);

  // Probable selectors for avatar
  const avatar = firstAttr($, [
    ".profile-avatar img",
    ".avatar img",
    ".player-avatar img",
    "img.profile-img",
    ".user-avatar img",
  ], "src");

  // Probable selectors for level / tier
  const level = firstText($, [
    ".player-level",
    ".level",
    ".profile-level",
    ".level-number",
    ".user-level",
  ]);

  // Rank / tier
  const rank = firstText($, [
    ".player-rank",
    ".rank-name",
    ".tier",
    ".rank",
    ".profile-rank",
  ]);

  // Winrate or KDA or win/loss stats
  const winRate = firstText($, [
    ".win-rate",
    ".stat-winrate",
    ".profile-winrate",
    ".wins-percent",
  ]);

  // Try to extract hero mastery top list (just pick some selectors)
  const heroes = [];
  $(".top-heroes li, .hero-list li, .heroes-list li").each((i, el) => {
    if (i >= 6) return; // limit
    const heroName = $(el).find(".hero-name").text().trim() || $(el).text().trim();
    if (heroName) heroes.push(heroName);
  });
  // fallback: try specific card selectors
  if (heroes.length === 0) {
    $("[data-hero-name]").each((i, el) => {
      if (i >= 6) return;
      const h = $(el).attr("data-hero-name");
      if (h) heroes.push(h);
    });
  }

  // Assemble result
  return {
    source: sourceUrl || null,
    nickname: nickname || null,
    uid: null, // uid not always present in html; keep null if unknown
    avatar: avatar || null,
    level: level || null,
    rank: rank || null,
    winRate: winRate || null,
    topHeroes: heroes,
    raw: null, // omitted to save space (could add full html if needed)
  };
}

/**
 * Main scraping function: needs uid (player id).
 * Returns normalized object or throws.
 */
async function mlStalk(uid) {
  // require uid - Mobile Legends uses numeric uid (biasanya 9-12 digit) but allow string
  if (!uid) throw new Error("UID kosong. Masukkan parameter uid (player id).");

  // fetch profile page HTML from known endpoints
  const { html, url } = await fetchProfileHtml(uid);

  // parse page
  const parsed = parseProfile(html, url);

  // try to find uid inside html (some sites include it)
  try {
    const $ = cheerio.load(html);
    const maybeUid = firstText($, [
      ".player-uid",
      ".uid",
      ".profile-uid",
      "span.uid",
      ".user-id",
    ]);
    if (maybeUid) parsed.uid = maybeUid.replace(/[^\d]/g, "");
  } catch (e) {
    // ignore
  }

  // attach small sanity check: if nickname & avatar both missing, probably parsing failed
  if (!parsed.nickname && !parsed.avatar) {
    parsed.warning = "Tidak menemukan field nickname/avatar — kemungkinan selector perlu diupdate untuk situs yang dipakai.";
  }

  return parsed;
}

module.exports = {
  name: "ML Stalk",
  desc: "Stalking mobile legends account",
  category: "Stalker",
  path: "/mlstalk?apikey=&uid=",
  async run(req, res) {
    const { apikey, uid } = req.query;

    if (!apikey || !global.apikey?.includes(apikey))
      return res.status(401).json({ status: false, error: "Apikey invalid" });

    if (!uid) return res.status(400).json({ status: false, error: "Parameter 'uid' diperlukan (Mobile Legends player id)" });

    try {
      const result = await mlStalk(uid);
      return res.status(200).json({ status: true, result });
    } catch (err) {
      // banyak kemungkinan error: 404, timeout, or site blocking
      const msg = err && err.response && err.response.status
        ? `Request failed with status code ${err.response.status}`
        : (err && err.message) ? err.message : "Unknown error";
      return res.status(500).json({ status: false, error: `Gagal mengambil data ML: ${msg}` });
    }
  }
};
