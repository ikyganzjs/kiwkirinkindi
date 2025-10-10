const axios = require("axios");

async function mlstalk(id) {
  const url = "https://api.mobilelegends.com/base/player_info";

  const data = {
    player_id: id.toString(),
    app_id: 20007,
    channel_id: 1,
    language: "id"
  };

  const headers = {
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json;charset=UTF-8",
    "origin": "https://www.mobilelegends.com",
    "referer": "https://www.mobilelegends.com/",
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
  };

  const response = await axios.post(url, data, { headers });
  return response.data;
}

module.exports = {
  name: "ML Stalk",
  desc: "Stalking Mobile Legends account",
  category: "Stalker",
  path: "/stalkml?apikey=&id=",
  async run(req, res) {
    const { apikey, id } = req.query;

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });

    if (!id)
      return res.json({ status: false, error: "Id player diperlukan!" });

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

