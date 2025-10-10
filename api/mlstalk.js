const axios = require("axios");

async function mlstalk(id) {
  let data = JSON.stringify({
    "app_id": 20007, // app_id untuk Mobile Legends
    "login_id": id
  });

  let config = {
    method: 'POST',
    url: 'https://kiosgamer.co.id/api/auth/player_id_login',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'sec-ch-ua-platform': '"Android"',
      'Origin': 'https://kiosgamer.co.id',
      'Referer': 'https://kiosgamer.co.id/',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cookie': 'source=mb; region=CO.ID;'
    },
    data: data
  };

  const api = await axios.request(config);
  return api.data;
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
      return res.json({ status: false, error: "Id is required" });

    try {
      const result = await mlstalk(id);
      res.status(200).json({
        status: true,
        creator: "IKY RESTAPI",
        result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message || "Gagal mengambil data dari KiosGamer"
      });
    }
  },
};
