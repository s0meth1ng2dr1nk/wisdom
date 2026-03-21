const cheerio = require("cheerio")
const collator = new Intl.Collator(undefined, { numeric: true })

const lang_priority_dict = {
  "JPN": "001",
  "ENG": "002",
}

const shop_priority_dict = {
  "晴れる屋": "001",
  "トレトク": "002",
  "BIGWEB" : "003",
  "Cardshop Serra": "200",
}
const priority_threshold = "100"


class WisdomGuild {
  constructor() {
    this.row
  }
  
  static async build(eng_name, jpn_name, allow_english, shop_count, output_english) {
    const wg = new WisdomGuild()
    let lang_list = ["JPN"]
    if (allow_english) {
      lang_list = ["JPN", "ENG"]
    }
    let output_name = jpn_name ?? eng_name
    if (output_english) {
      output_name = eng_name
    }
    const price_list = await wg.fetchPriceList(eng_name, lang_list, shop_count);
    wg.row = await wg.flatPriceList(output_name, price_list)

    return wg
  }

  async fetchPriceList(eng_name, lang_list, shop_count) {
    let result_list = []

    const encoded_name = eng_name.replace(/ /g, "+")
    const base_url = `https://wonder.wisdom-guild.net/price/${encoded_name}/?stock_gt=1&sort=price&sort_op=asc&lang%5B%5D=`
    
    let price_dict = {}
    let consumed_shop_list = []
    for (const lang of lang_list) {
      const lang_priority = lang_priority_dict[lang]
      const url = `${base_url}${lang}`

      const response = await fetch(url)
      const html = await response.text()      
      if (!html.includes("table-main")) {
        result_list.push([0, "NaN", "NaN", url])
        return result_list
      }

      const $ = cheerio.load(html)

      const row_list = $("table.table-main tbody tr").toArray()
      
      for (const row of row_list) {
        const tds = $(row).find("td")

        const shop = $(tds[0]).text().trim()
        
        if (consumed_shop_list.includes(shop)) {
          continue
        }

        const price =$(tds[1]).text().replace(/[^\d]/g, "")
        const lang = $(tds[3]).text().trim()
        const link = $(tds[7]).find("a").attr("href")
        
        const shop_priority = shop_priority_dict[shop] ?? priority_threshold

        const price_key = `${price}_${lang_priority}_${shop_priority}`

        if (!price_dict[price_key]) {
          price_dict[price_key] = {}
        }
        
        if (price_dict[price_key][shop]) {
          continue  
        }
        
        consumed_shop_list.push(shop)
        price_dict[price_key][shop] = [price, lang, shop, link]
      }
    }
    
    

    const price_key_list = Object.keys(price_dict).sort(collator.compare)
    
    for (const price_key of price_key_list) {
      const shop_dict = price_dict[price_key]
      const shop_key_list = Object.keys(shop_dict).sort(collator.compare)
      
      for (const shop_key of shop_key_list) {
        result_list.push(shop_dict[shop_key])
      }
    }
    
    return result_list.splice(0, shop_count)
  }

  async flatPriceList(output_name, price_list) {
    let result = `${output_name}`
    for (const price_lang_shop_link of price_list) {
      const price = Number(price_lang_shop_link[0]).toLocaleString()
      // const lang = price_lang_shop_link[1]
      const shop = price_lang_shop_link[2]
      const link = price_lang_shop_link[3]
      result = `${result} | [${price}(${shop})](${link})`
    }
    return result
  }
}


module.exports = WisdomGuild
