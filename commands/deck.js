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

async function executeCommand(interaction) {
  const deck_url = interaction.options.getString(ARG1)
  const allow_english = interaction.options.getBoolean(ARG2) ?? false
  const shop_count = interaction.options.getInteger(ARG3) ?? 3
  const output_english = interaction.options.getBoolean(ARG4) ?? false

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
  for (const card_name of site.deck_list) {
    const sf = await Scryfall.build(card_name)
    // 英語版が見つからない（=存在しないカード）
    if (sf.eng_name == null) {
      message_list.push(`${card_name}が見つかりませんでした`)
    }

    const wg = await WisdomGuild.build(sf.eng_name, sf.jpn_name, allow_english, shop_count, output_english)
    message_list.push(wg.row)
  }

  return message_list
}

module.exports = {
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
    const chunk_size = 5
    const chunk_list = Array.from({ length: Math.ceil(message_list.length / chunk_size) }, (_, i) =>
      message_list.slice(i * chunk_size, i * chunk_size + chunk_size)
    );
    
    let message = chunk_list[0].join('\n')
    await interaction.editReply(`${message}`)
    for (let i = 1; i < chunk_list.length; i++) {
      message = chunk_list[i].join('\n')
      await interaction.followUp(`${message}`);
    }
  },
}
