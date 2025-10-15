const axios = require("axios");

module.exports = {
  name: "Perplexity",
  desc: "Scrape jawaban AI dari Perplexity tanpa Puppeteer",
  category: "Scraper",
  path: "/scrape/perplexity?apikey=&query=",
  async run(req, res) {
    const { apikey, query } = req.query;
    if (!global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid!" });
    if (!query) return res.json({ status: false, error: "Missing query" });

    try {
      const response = await axios.post(
        "https://www.perplexity.ai/api/search",
        {
          q: query,
          source: "default",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Referer: "https://www.perplexity.ai/",
            Origin: "https://www.perplexity.ai",
          },
        }
      );

      const data = response.data;
      let text = "Tidak ditemukan konten yang valid.";

      if (data && data.text) {
        text = data.text;
      } else if (data?.answer?.text) {
        text = data.answer.text;
      } else if (data?.result) {
        text = data.result;
      }

      res.json({
        status: true,
        creator: "IKY RESTAPI",
        result: {
          query,
          text,
        },
      });
    } catch (err) {
      res.json({
        status: false,
        error:
          err.response?.status === 403
            ? "403 Forbidden — Akses API dibatasi Perplexity"
            : err.message,
      });
    }
  },
};
