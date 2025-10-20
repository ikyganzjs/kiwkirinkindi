// brat.js
// Requires: npm i axios cheerio
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://bratgenerator.cloud';
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';

async function fetchHtml(url) {
  const target = url || BASE_URL;
  try {
    const res = await axios.get(target, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 15000,
      responseType: 'text'
    });
    return { ok: true, data: res.data, finalUrl: res.request?.res?.responseUrl || target };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function scrapeBratPage(pageUrl) {
  const fetched = await fetchHtml(pageUrl);
  if (!fetched.ok) return { status: false, error: fetched.error };

  const html = fetched.data;
  const baseForRelative = fetched.finalUrl || (pageUrl || BASE_URL);
  const $ = cheerio.load(html);
  const items = [];

  // Generic selectors for brat-like template lists; adjust if needed
  $('a[href*="template"], a[href*="editor"], .template-card, .generator-card, .template, .thumb, .item').each((i, el) => {
    const root = $(el);
    let link = root.attr('href') || root.find('a').attr('href') || null;
    let img = root.find('img').attr('src') || root.attr('data-src') || null;
    let title = root.find('h2, h3, .title, .template-name').text().trim() || root.attr('title') || root.find('img').attr('alt') || null;

    if (link) {
      try { link = new URL(link, baseForRelative).href; } catch (e) { /* ignore */ }
    }
    if (img) {
      try { img = new URL(img, baseForRelative).href; } catch (e) { /* ignore */ }
    }

    if (link || img) {
      items.push({
        title: title || null,
        image: img || null,
        generator: link || null
      });
    }
  });

  // fallback: ambil gambar besar jika belum ada item
  if (items.length === 0) {
    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      const alt = $(el).attr('alt') || null;
      if (!src) return;
      let full = src;
      try { full = new URL(src, baseForRelative).href; } catch (e) {}
      items.push({ title: alt, image: full, generator: null });
    });
  }

  return { status: true, count: items.length, items };
}

/*
  Export route similar with cekewallet.js pattern.
  Example usage:
    GET /orderkuota/brat?apikey=KEY                     -> will scrape default BASE_URL (https://bratgenerator.cloud)
    GET /orderkuota/brat?apikey=KEY&url=https://...     -> will scrape provided URL
*/
module.exports = [
  {
    name: "Scrape Brat",
    desc: "Scrape daftar template Brat (title, image, generator link) dari bratgenerator.cloud atau URL yang diberikan",
    category: "Tools",
    path: "/tools/brat?apikey=&query=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;

        // validasi global.apikey seperti style projectmu (cekewallet.js)
        if (!global.apikey || !Array.isArray(global.apikey)) {
          return res.json({ status: false, error: "Server misconfigured (missing global.apikey)" });
        }
        if (!apikey || !global.apikey.includes(apikey)) {
          return res.json({ status: false, error: "Apikey invalid" });
        }

        // gunakan url jika ada, kalau tidak gunakan BASE_URL
        const targetUrl = url && url.length ? url : BASE_URL;

        // optional: batasi hanya domain bratgenerator.cloud jika perlu
        // try {
        //   const host = new URL(targetUrl).hostname;
        //   if (!host.includes('bratgenerator.cloud')) {
        //     return res.json({ status: false, error: 'Domain not allowed' });
        //   }
        // } catch (e) {
        //   return res.json({ status: false, error: 'Invalid URL' });
        // }

        const result = await scrapeBratPage(targetUrl);

        return res.json({
          status: result.status,
          source: targetUrl,
          fetchedAt: new Date().toISOString(),
          count: result.count || 0,
          items: result.items || [],
          error: result.error || null
        });
      } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
      }
    }
  }
];
