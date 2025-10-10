const axios = require("axios");

async function mlstalk(id) {
  const endpoint = `https://corsproxy.io/?https://kiosgamer.co.id/api/auth/player_id_login`;

  const data = {
    app_id: 20007,
    login_id: id
  };

  const headers = {
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json",
    "origin": "https://kiosgamer.co.id",
    "referer": "https://kiosgamer.co.id/app/20007",
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36"
  };

  const response = await axios.post(endpoint, data, { headers });
  return response.data;
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
        creator: "IKY RESTAPI",
        error: error.response?.data || error.message
      });
    }
  }
};
