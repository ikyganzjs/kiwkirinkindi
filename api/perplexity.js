const axios = require("axios");

module.exports = {
  name: "Perplexity",
  desc: "AI Perplexity",
  category: "Openai",
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
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            Connection: "keep-alive",
            Referer: "https://www.google.com/",
            DNT: "1",
          },
        }
      );

      // Ambil paragraf teks dari HTML
      const match = html.match(/<p[^>]*>(.*?)<\/p>/g);
      let cleanText = "No content found";

      if (match && match.length > 0) {
        cleanText = match
          .map((p) =>
            p
              .replace(/<[^>]+>/g, "")
              .replace(/\s+/g, " ")
              .trim()
          )
          .filter((t) => t.length > 50)
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
    } catch (e) {
      res.json({ status: false, error: e.message });
    }
  },
};
