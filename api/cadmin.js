// api/panel/cadmin.js
const axios = require('axios');
const crypto = require('crypto');

module.exports = {
  name: "Create Admin Panel (cadmin)",
  desc: "Membuat akun admin pada Panel Pterodactyl melalui API panel",
  category: "Panel Pterodatcly",
  path: "/panel/cadmin?apikey=&panelDomain=&panelApiKey=&username=&name=",

  async run(req, res) {
    try {
      const { apikey, panelDomain, panelApiKey, username, name } = req.query;

      // validasi apikey server
      if (!apikey || !global.apikey || !global.apikey.includes(apikey)) {
        return res.status(403).json({ status: false, error: "Apikey invalid" });
      }

      // validasi parameter minimal
      if (!panelDomain || !panelApiKey || !username) {
        return res.status(400).json({
          status: false,
          error: "Missing parameters. Required: panelDomain, panelApiKey, username (optional: name)"
        });
      }

      // sanitasi & format panelDomain
      let domain = panelDomain.trim();
      if (!/^https?:\/\//i.test(domain)) domain = "https://" + domain;
      // hapus trailing slash
      domain = domain.replace(/\/+$/,"");

      // siapkan data akun
      const userLower = username.trim().toLowerCase();
      const email = `${userLower}@gmail.com`;
      const capitalize = (s) => {
        if (!s) return "";
        return s.trim().split(' ')
          .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(' ');
      };
      const firstName = name ? capitalize(name) : capitalize(userLower);
      const password = userLower + crypto.randomBytes(2).toString('hex'); // sama pola seperti kode awal

      // payload sesuai Pterodactyl API
      const payload = {
        email,
        username: userLower,
        first_name: firstName,
        last_name: "Admin",
        root_admin: true,
        language: "en",
        password: password.toString()
      };

      // panggil API panel
      const url = `${domain}/api/application/users`;
      const response = await axios.post(url, payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${panelApiKey}`
        },
        timeout: 20000
      });

      const data = response.data;

      // cek error dari panel
      if (data?.errors) {
        return res.status(400).json({ status: false, error: data.errors });
      }

      // pada pterodactyl v1, data attributes ada di data.attributes
      const user = data?.attributes || data?.data || data;

      // balas informasi akun (sertakan password)
      return res.json({
        status: true,
        message: "Admin panel created",
        account: {
          id: user?.id || user?.object_id || null,
          username: userLower,
          password,
          email,
          first_name: firstName,
          last_name: "Admin",
          panelDomain: domain
        },
        raw: data
      });

    } catch (err) {
      console.error("cadmin error:", err?.response?.data || err.message || err);
      // Tampilkan kesalahan dari panel jika ada
      if (err?.response?.data) {
        return res.status(err.response.status || 500).json({
          status: false,
          error: err.response.data
        });
      }
      return res.status(500).json({ status: false, error: err.message || String(err) });
    }
  }
};
