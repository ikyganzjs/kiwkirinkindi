const { Client } = require('ssh2');
const stream = require("stream");

module.exports = {
  name: "Install Tema Nebula",
  desc: "Menginstall tema Nebula Pterodactyl di VPS melalui SSH",
  category: "Install Panel",
  path: "/installpanel/installnebula?apikey=&ip=&password=",
  
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

    // 🔥 Perintah install tema Nebula
    const command = `bash <(curl -s https://raw.githubusercontent.com/KiwamiXq1031/installer-premium/refs/heads/main/zero.sh)`;

    const conn = new Client();

    // Animasi progress seperti startwings
    const animasi = [
      "🎨 Menyiapkan pemasangan tema Nebula...",
      "🪶 Mengunduh file tema...",
      "⚙️ Menginstall depend yang diperlukan...",
      "🔧 Menerapkan tema pada panel...",
      "💫 Menyelesaikan proses instalasi..."
    ];
    let i = 0;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const send = (msg) => {
      console.log(msg);
      res.write(msg + "\n");
    };

    // Interval animasi
    const animInterval = setInterval(() => {
      if (i < animasi.length) {
        send(animasi[i]);
        i++;
      } else {
        clearInterval(animInterval);
      }
    }, 4000);

    try {
      conn.on("ready", () => {
        send(`🚀 [SSH] Terhubung ke ${ip} — memulai instalasi tema Nebula...\n`);

        conn.exec(command, (err, stream) => {
          if (err) {
            clearInterval(animInterval);
            console.error(err);
            return res.status(500).json({ status: false, error: "Gagal menjalankan perintah SSH" });
          }

          // Jalankan input otomatis sesuai skrip kamu
          stream.on("data", async (data) => {
            const log = data.toString();
            console.log(`[SSH ${ip}] ${log}`);

            if (log.includes("Masukkan pilihan:")) stream.write("2\n");
            if (log.includes("Tekan Enter")) stream.write("\n");
          });

          // Saat proses selesai
          stream.on("close", (code, signal) => {
            clearInterval(animInterval);
            send("✅ Tema Nebula berhasil diinstal pada panel kamu!\n");
            conn.end();
            res.end("Selesai ✅\n");
          });

          stream.stderr.on("data", (data) => {
            send("[⚠️ STDERR] " + data.toString());
          });
        });
      });

      conn.on("error", (err) => {
        clearInterval(animInterval);
        console.error("[SSH ERROR]", err);
        send("❌ Gagal terhubung ke VPS! Cek IP / Password kamu.");
        res.end();
      });

      conn.connect(connSettings);

    } catch (error) {
      clearInterval(animInterval);
      console.error("Error:", error);
      res.status(500).json({ status: false, error: error.message });
    }
  }
};
