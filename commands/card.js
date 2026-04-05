require("dotenv").config()
const path = require("node:path")
const { SlashCommandBuilder } = require("discord.js")
const WisdomGuild = require(path.join(path.dirname(require.main.filename), "util/wisdomguild.js"))
const Scryfall = require(path.join(path.dirname(require.main.filename), "util/scryfall.js"))

const ARG1 = "card_name"
const ARG2 = "allow_english"
const ARG3 = "shop_count"
const ARG4 = "output_english"

async function searchCard(card_name, allow_english = false, shop_count = 3, output_english = false) {
  const sf = await Scryfall.build(card_name)
  if (sf.eng_name == null) {
    throw new Error(`${card_name}が見つかりませんでした`)
  }
  const wg = await WisdomGuild.build(sf.eng_name, sf.jpn_name, allow_english, shop_count, output_english)
  return wg.row
}

async function executeCommand(interaction) {
  const card_name = interaction.options.getString(ARG1)
  const allow_english = interaction.options.getBoolean(ARG2) ?? false
  const shop_count = interaction.options.getInteger(ARG3) ?? 3
  const output_english = interaction.options.getBoolean(ARG4) ?? false
  return searchCard(card_name, allow_english, shop_count, output_english)
}

module.exports = {
  searchCard,
  data: new SlashCommandBuilder()
    .setName("card")
    .setDescription("カードの最安値を表示します")
    .addStringOption(option =>
      option
        .setName(ARG1)
        .setDescription("カード名を指定してください")
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
    const message = await executeCommand(interaction)
    await interaction.editReply(message)
  },
}
