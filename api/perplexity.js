const axios = require("axios");

module.exports = {
  name: "Perplexity",
  desc: "Scrape hasil jawaban AI dari Perplexity",
  category: "Scraper",
  path: "/scrape/perplexity?apikey=&query=",
  async run(req, res) {
    const { apikey, query } = req.query;
    if (!global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid!" });
    if (!query) return res.json({ status: false, error: "Missing query" });

    try {
      const { data: html } = await axios.get(
        `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Referer: "https://www.google.com/",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            DNT: "1",
            Cookie:
              "theme=dark; _pxhd=random_value_123456; cf_clearance=random_value_98765",
          },
          timeout: 10000,
          validateStatus: () => true,
        }
      );

      if (!html || html.includes("Access denied") || html.includes("403"))
        return res.json({
          status: false,
          error:
            "403 Forbidden — Perplexity menolak akses langsung. Coba pakai proxy atau header lain.",
        });

      // Ambil teks hasil AI
      const match = html.match(/<p[^>]*>(.*?)<\/p>/g);
      let cleanText = "Tidak ditemukan konten yang valid.";

      if (match && match.length > 0) {
        cleanText = match
          .map((p) => p.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
          .filter((t) => t.length > 30)
          .slice(0, 5)
          .join("\n\n");
      }

      res.json({
        status: true,
        creator: "IKY RESTAPI",
        result: {
          query,
          text: cleanText,
        },
      });
    } catch (err) {
      console.error(err);
      res.json({
        status: false,
        error: err.message || "Gagal scrape dari Perplexity",
      });
    }
  },
};
