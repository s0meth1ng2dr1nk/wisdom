require("dotenv").config()
const express = require("express")
const crypto = require("crypto")
const path = require("node:path")

// require.main.filename が bot.js を指すため、server.js から呼ぶ場合は __filename を使う
// util/ の require で require.main.filename を使っているため、ここで上書きする
require.main.filename = __filename

const { searchCard } = require("./commands/card.js")
const { searchDeck } = require("./commands/deck.js")

const app = express()
const PORT = process.env.PORT || 3000
const PASSWORD = process.env.WEB_PASSWORD

if (!PASSWORD) {
  console.error("WEB_PASSWORD が .env に設定されていません")
  process.exit(1)
}

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, ngrok-skip-browser-warning")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  if (req.method === "OPTIONS") return res.sendStatus(204)
  next()
})

// パスワード認証ミドルウェア
function authenticate(req, res, next) {
  const auth = req.headers["authorization"] || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  try {
    const match = crypto.timingSafeEqual(Buffer.from(token), Buffer.from(PASSWORD))
    if (!match) return res.status(401).json({ error: "認証失敗" })
  } catch {
    return res.status(401).json({ error: "認証失敗" })
  }
  next()
}

// GET /api/card?name=Sol+Ring&allow_english=false&shop_count=3&output_english=false
app.get("/api/card", authenticate, async (req, res) => {
  const { name, allow_english, shop_count, output_english } = req.query
  if (!name) return res.status(400).json({ error: "name パラメータが必要です" })

  try {
    const row = await searchCard(
      name,
      allow_english === "true",
      shop_count ? parseInt(shop_count, 10) : 3,
      output_english === "true"
    )
    res.json({ row })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/deck?url=https://...&allow_english=false&shop_count=3&output_english=false
app.get("/api/deck", authenticate, async (req, res) => {
  const { url, allow_english, shop_count, output_english } = req.query
  if (!url) return res.status(400).json({ error: "url パラメータが必要です" })

  try {
    const { list, summary } = await searchDeck(
      url,
      allow_english === "true",
      shop_count ? parseInt(shop_count, 10) : 3,
      output_english === "true"
    )
    res.json({ list, summary })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`)
})
