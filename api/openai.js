const fetch = require("node-fetch");

const Apis = ["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"]

const GROQ_API_KEY = Apis[Math.floor(Math.random() * Apis.length)];

async function askGroq(prompt, question, model = "moonshotai/kimi-k2-instruct-0905") {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: question
          }
        ]
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response from model.";
  } catch (error) {
    console.error("Error:", error);
    return "Error while fetching response.";
  }
}

module.exports = [
{
    name: "Grok",
    desc: "Ai grok models",
    category: "Openai",
    path: "/ai/grok?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "compound-beta")

            res.status(200).json({
                status: true,
                result: result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    }
},

{
    name: "Chat GPT",
    desc: "Ai chat gpt models",
    category: "Openai",
    path: "/ai/chatgpt?apikey=&question=",
    async run(req, res) {
        const { apikey, question, model, prompt } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        if (!question) {
            return res.json({ status: false, error: "Parameter 'question' is required" });
        }

        try {
            const result = await askGroq("", question, "openai/gpt-oss-120b")

            res.status(200).json({
                status: true,
                result: result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    }
}, 

{
    name: "Gemini",
    desc: "AI Gemini Models",
    category: "OpenAI",
    path: "/ai/gemini?apikey=&prompt=",

    async run(req, res) {
        try {
            const { apikey, prompt } = req.query;

            // 🔒 Validasi API key
            if (!apikey) {
                return res.status(400).json({
                    creator: "IKY RESTAPI",
                    status: false,
                    error: "Parameter 'apikey' is required"
                });
            }

            if (!global.apikey || !global.apikey.includes(apikey)) {
                return res.status(403).json({
                    creator: "IKY RESTAPI",
                    status: false,
                    error: "Invalid API key"
                });
            }

            // 🔍 Validasi prompt
            if (!prompt) {
                return res.status(400).json({
                    creator: "IKY RESTAPI",
                    status: false,
                    error: "Prompt is required"
                });
            }

            // 🚀 Jalankan model AI Gemini
            const result = await askGroq(
                "Sekarang Kamu Adalah AI Model Gemini",
                prompt,
                "openai/gpt-oss-120b"
            );

            return res.status(200).json({
                creator: "IKY RESTAPI",
                status: true,
                result: result
            });

        } catch (err) {
            console.error("[Gemini Error]:", err);
            return res.status(500).json({
                creator: "IKY RESTAPI",
                status: false,
                error: "Internal server error: " + err.message
            });
        }
    }
},

{
  name: "GPT Prompt",
  desc: "Ai gpt prompt models",
  category: "Openai",
  path: "/ai/gpt?apikey=&prompt=&text=",

  async run(req, res) {
    const { text, prompt, apikey } = req.query;

    if (!text)
      return res.json({ status: false, error: "Text is required" });

    if (!apikey || !global.apikey?.includes(apikey))
      return res.json({ status: false, error: "Invalid API key" });
      
    try {
      const result = await askGroq(prompt, text, "openai/gpt-oss-120b")

            res.status(200).json({
                status: true,
                result: result
            });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
}

]
