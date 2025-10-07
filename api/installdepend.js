const { Client } = require('ssh2');
const stream = require("stream");

module.exports = {
  name: "Install Depend Pterodactyl",
  desc: "Menginstall depend server pterodactyl di VPS melalui SSH",
  category: "Install Panel",
  path: "/installpanel/installdepend?apikey=&ip=&password=",
  async run(req, res) {
    const { apikey, ip, password } = req.query;

    // ✅ Validasi apikey
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(403).json({ status: false, error: "Apikey invalid" });
    }

    // ⚠️ Cek parameter
    if (!ip || !password) {
      return res.status(400).json({ status: false, error: "Parameter ip & password wajib diisi" });
    }

    const connSettings = {
      host: ip,
      port: 22,
      username: "root",
      password: password
    };

    // 🔥 Perintah install depend
    const command = `bash <(curl -s https://raw.githubusercontent.com/KiwamiXq1031/installer-premium/refs/heads/main/zero.sh)`;

    const conn = new Client();
    try {
      conn.on("ready", () => {
        console.log(`[SSH] Terhubung ke ${ip} — mulai instalasi depend...`);
        let output = "";

        conn.exec(command, (err, stream) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ status: false, error: "Gagal menjalankan perintah instalasi" });
          }

          // Jalankan input otomatis sesuai skrip kamu
          stream.on("data", async (data) => {
            const log = data.toString();
            output += log;
            console.log(`[SSH ${ip}] ${log}`);

            if (log.includes("Masukkan angka:")) {
              stream.write("11\n");
            }
            if (log.includes("Ketik huruf:")) {
              stream.write("A\n");
            }
            if (log.includes("(Y/n)")) {
              stream.write("Y\n");
            }
          });

          stream.stderr.on("data", (data) => {
            console.log(`[SSH STDERR ${ip}] ${data.toString()}`);
          });

          stream.on("close", (code, signal) => {
            console.log(`[SSH] Instalasi depend selesai di ${ip}`);
            conn.end();
            return res.status(200).json({
              status: true,
              message: "Berhasil install depend Pterodactyl ✅",
              ip,
              output: output.slice(-500) // ambil 500 baris terakhir dari log
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
      console.error("Error installdepend:", error);
      return res.status(500).json({ status: false, error: error.message });
    }
  }
};