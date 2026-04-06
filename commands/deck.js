require("dotenv").config()
const path = require("node:path")
const { SlashCommandBuilder } = require("discord.js")
const WisdomGuild = require(path.join(path.dirname(require.main.filename), "util/wisdomguild.js"))
const Scryfall = require(path.join(path.dirname(require.main.filename), "util/scryfall.js"))
const Hareruya = require(path.join(path.dirname(require.main.filename), "util/hareruya.js"))
const ManaBox = require(path.join(path.dirname(require.main.filename), "util/manabox.js"))
const Moxfield = require(path.join(path.dirname(require.main.filename), "util/moxfield.js"))

const ARG1 = "deck_url"
const ARG2 = "allow_english"
const ARG3 = "shop_count"
const ARG4 = "output_english"

async function searchDeck(deck_url, allow_english = false, shop_count = 3, output_english = false) {
  let site = null
  if (deck_url.startsWith("https://www.hareruya")) {
    site = await Hareruya.build(deck_url)
  } else if (deck_url.startsWith("https://manabox")) {
    site = await ManaBox.build(deck_url)
  } else if (deck_url.startsWith("https://moxfield")) {
    site = await Moxfield.build(deck_url)
  }

  if (site == null) {
    throw new Error(`晴れる屋、ManaBox、MoxfieldのURLを指定してください`)
  }

  if (site.deck_list == null || site.deck_list.length == 0) {
    throw new Error(`デッキリストの取得に失敗しました`)
  }

  let message_list = []
  const shopTotals = {}  // { shopName: { total, count } }
  let totalCards = 0

  for (const card_name of site.deck_list) {
    totalCards++
    const sf = await Scryfall.build(card_name)
    if (sf.eng_name == null) {
      message_list.push({ name: card_name, error: `${card_name}が見つかりませんでした` })
      continue
    }
    const wg = await WisdomGuild.build(sf.eng_name, sf.jpn_name, allow_english, shop_count, output_english)
    message_list.push({ name: sf.jpn_name ?? sf.eng_name, row: wg.row })

    for (const [shop, price] of Object.entries(wg.shopPrices)) {
      if (!shopTotals[shop]) shopTotals[shop] = { total: 0, count: 0, cards: [] }
      shopTotals[shop].total += price
      shopTotals[shop].count++
      shopTotals[shop].cards.push({ name: sf.jpn_name ?? sf.eng_name, price })
    }
  }

  const summary = Object.entries(shopTotals)
    .map(([shop, { total, count, cards }]) => ({
      shop,
      total,
      missing: totalCards - count,
      cards: cards.sort((a, b) => a.price - b.price),
    }))
    .sort((a, b) => a.total - b.total)

  return { list: message_list, summary }
}

async function executeCommand(interaction) {
  const deck_url = interaction.options.getString(ARG1)
  const allow_english = interaction.options.getBoolean(ARG2) ?? false
  const shop_count = interaction.options.getInteger(ARG3) ?? 3
  const output_english = interaction.options.getBoolean(ARG4) ?? false
  const { list } = await searchDeck(deck_url, allow_english, shop_count, output_english)
  return list
}

module.exports = {
  searchDeck,
  data: new SlashCommandBuilder()
    .setName("deck")
    .setDescription("デッキの最安値を表示します")
    .addStringOption(option =>
      option
        .setName(ARG1)
        .setDescription("デッキリストURLを指定してください（晴れる屋、MoxField、ManaBoxに対応）")
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName(ARG2)
        .setDescription("英語版も許可する場合はTrue")
    )
    .addIntegerOption(option =>
      option
        .setName(ARG3)
        .setDescription("ショップ数を指定してください")
    )
    .addBooleanOption(option =>
      option
        .setName(ARG4)
        .setDescription("英語版で結果出力する場合はTrue")
    ),
  execute: async function(interaction) {
    await interaction.deferReply()

    const message_list = await executeCommand(interaction)
    const rows = message_list.map(item => item.error ?? item.row)
    const chunk_size = 5
    const chunk_list = Array.from({ length: Math.ceil(rows.length / chunk_size) }, (_, i) =>
      rows.slice(i * chunk_size, i * chunk_size + chunk_size)
    )

    await interaction.editReply(chunk_list[0].join('\n'))
    for (let i = 1; i < chunk_list.length; i++) {
      await interaction.followUp(chunk_list[i].join('\n'))
    }
  },
}
