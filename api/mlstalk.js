const axios = require("axios");

async function mlstalk(id) {
  const data = JSON.stringify({
    app_id: 20007, // Mobile Legends
    login_id: id
  });

  const config = {
    method: "POST",
    url: "https://kiosgamer.co.id/api/auth/player_id_login",
    headers: {
      "authority": "kiosgamer.co.id",
      "accept": "application/json, text/plain, */*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/json",
      "origin": "https://kiosgamer.co.id",
      "referer": "https://kiosgamer.co.id/app/20007",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36",
      "cookie": "region=CO.ID; source=mb;"
    },
    data
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
        creator: "IKY RESTAPI",
        error: error.response?.data || error.message
      });
    }
  }
};
