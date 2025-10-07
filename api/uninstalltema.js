const { Client } = require("ssh2");
const stream = require("stream");

module.exports = {
  name: "Uninstall Tema Pterodactyl",
  desc: "Menghapus tema Pterodactyl di VPS melalui SSH",
  category: "Install Panel",
  path: "/installpanel/uninstalltema?apikey=&ip=&password=",

  async run(req, res) {
    const { apikey, ip, password } = req.query;

    // ✅ Validasi APIKEY
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(403).json({ status: false, error: "Apikey invalid" });
    }

    // ⚠️ Cek parameter
    if (!ip || !password) {
      return res.status(400).json({ status: false, error: "Parameter ip & password wajib diisi" });
    }

    // 🔧 Konfigurasi koneksi SSH
    const connSettings = {
      host: ip,
      port: 22,
      username: "root",
      password: password,
    };

    // 🔥 Command uninstall tema
    const command = `bash <(curl -s https://raw.githubusercontent.com/SkyzoOffc/Pterodactyl-Theme-Autoinstaller/main/install.sh)`;
    const conn = new Client();

    // 🪄 Header streaming supaya log tampil realtime di browser
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const send = (msg) => {
      console.log(msg);
      res.write(msg + "\n");
    };

    // ✨ Animasi progress seperti startwings
    const progress = [
      "🔧 Menghapus file tema dari panel...",
      "⚙️ Membersihkan konfigurasi tema...",
      "🧹 Menghapus depend lama...",
      "🔄 Merapikan file sistem panel...",
      "💫 Menyelesaikan proses uninstall..."
    ];
    let step = 0;

    const animInterval = setInterval(() => {
      if (step < progress.length) {
        send(progress[step]);
        step++;
      } else {
        clearInterval(animInterval);
      }
    }, 5000);

    // 🚀 Saat koneksi SSH siap
    conn.on("ready", () => {
      send(`🚀 [SSH] Terhubung ke ${ip} — memulai proses *uninstall tema Pterodactyl*...\n`);

      conn.exec(command, (err, stream) => {
        if (err) {
          clearInterval(animInterval);
          send("❌ Gagal menjalankan perintah SSH!");
          return res.end();
        }

        // Saat data dari terminal diterima
        stream.on("data", (data) => {
          const log = data.toString();
          console.log(`[SSH ${ip}] ${log}`);

          // Input otomatis sesuai script Skyzo
          if (log.includes("Key Token")) stream.write("skyzodev\n");
          if (log.includes("Masukkan pilihan")) stream.write("2\n");
          if (log.includes("(Y/n)")) stream.write("y\n");
          if (log.includes("Tekan [x]")) stream.write("x\n");
        });

        // Saat proses selesai
        stream.on("close", (code, signal) => {
          clearInterval(animInterval);
          send("\n✅ *Uninstall tema Pterodactyl selesai!* Tema telah berhasil dihapus dari panel kamu.");
          conn.end();
          res.end("\nSelesai ✅\n");
        });

        // Error dari SSH
        stream.stderr.on("data", (data) => {
          send("[⚠️ STDERR] " + data.toString());
        });
      });
    });

    // ❌ Saat koneksi error
    conn.on("error", (err) => {
      clearInterval(animInterval);
      console.error("[SSH ERROR]", err);
      send("❌ Gagal terhubung ke VPS! Periksa IP / password yang kamu masukkan.");
      res.end();
    });

    // 🔌 Jalankan koneksi
    conn.connect(connSettings);
  },
};
