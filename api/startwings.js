const { Client } = require('ssh2');
const stream = require("stream");

module.exports = {
  name: "Start Wings",
  desc: "Menjalankan service Wings di VPS melalui SSH",
  category: "Install Panel",
  path: "/installpanel/startwings?apikey=&ip=&password=&token=",
  async run(req, res) {
    const { apikey, ip, password, token } = req.query;

    // 🔑 Cek apikey
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(403).json({ status: false, error: "Apikey invalid" });
    }

    // 🔎 Cek parameter wajib
    if (!ip || !password || !token) {
      return res.status(400).json({ status: false, error: "Parameter ip, password, dan token wajib diisi" });
    }

    const connSettings = {
      host: ip,
      port: 22,
      username: "root",
      password
    };

    const command = `${token} && systemctl start wings`;
    const conn = new Client();

    try {
      conn.on("ready", () => {
        console.log(`[SSH] Terhubung ke ${ip}, menjalankan Wings...`);

        conn.exec(command, (err, stream) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ status: false, error: "Gagal menjalankan perintah di server." });
          }

          let output = "";
          stream.on("data", (data) => {
            output += data.toString();
          });

          stream.stderr.on("data", (data) => {
            console.warn("[SSH STDERR]:", data.toString());
            stream.write("y\n");
            stream.write("systemctl start wings\n");
          });

          stream.on("close", (code, signal) => {
            console.log(`[SSH] Wings berhasil dijalankan di ${ip}`);
            conn.end();
            return res.status(200).json({
              status: true,
              message: "Wings berhasil dijalankan!",
              ip,
              output
            });
          });
        });
      });

      conn.on("error", (err) => {
        console.error("[SSH ERROR]", err);
        return res.status(500).json({
          status: false,
          error: err.message.includes("authentication") ? "Password VPS salah"
            : err.message.includes("timed out") ? "Koneksi SSH timeout"
            : err.message
        });
      });

      conn.connect(connSettings);

    } catch (error) {
      console.error("Error StartWings:", error);
      return res.status(500).json({ status: false, error: error.message });
    }
  }
};
