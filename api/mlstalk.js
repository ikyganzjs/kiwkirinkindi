const axios = require("axios");

async function mlstalk(id) {
  const data = {
    app_id: 20007, // Mobile Legends
    login_id: id.toString(),
    zone_id: "ID" // Wajib ada!
  };

  const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "Origin": "https://kiosgamer.co.id",
    "Referer": "https://kiosgamer.co.id/",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  };

  try {
    const response = await axios.post("https://kiosgamer.co.id/api/auth/player_id_login", data, { headers });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || "Gagal mengambil data ML"
    );
  }
}

module.exports = {
  name: "ML Stalk",
  desc: "Stalking Mobile Legends account",
  category: "Stalker",
  path: "/stalk/ml?apikey=&id=",
  async run(req, res) {
    const { apikey, id } = req.query;

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });

    if (!id)
      return res.json({ status: false, error: "ID player diperlukan!" });

    try {
      const result = await mlstalk(id);
      if (!result || !result.nickname)
        return res.status(404).json({
          status: false,
          message: "Akun tidak ditemukan atau tidak valid.",
          response: result
        });

      res.json({
        status: true,
        creator: "IKY RESTAPI",
        result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "IKY RESTAPI",
        error: error.message
      });
    }
  },
};
