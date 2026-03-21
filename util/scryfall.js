class Scryfall {
  constructor() {
    this.jpn_name = null
    this.eng_name = null
  }
  
  static async build(card_name) {
    const sf = new Scryfall()
    const translation_dict = await sf.fetchTranslationDict(card_name)
    sf.jpn_name = translation_dict["JPN"] ?? null
    sf.eng_name = translation_dict["ENG"] ?? null

    return sf
  }

  async fetchTranslationDict(card_name) {
    let translation_dict = {}

    for (const lang of ["ja", "en"]) {
      const encoded = encodeURIComponent(`:${lang} !"${card_name}"`)
      const url = `https://api.scryfall.com/cards/search?total_cards=1&q=lang${encoded}`

      const response = await fetch(url)
      const data = await response.json()
      
      if (!data.data || data.data.length == 0) {
        continue
      }

      const first_card = data.data[0]
      translation_dict["ENG"] = first_card.name

      if (lang != "ja") {
        continue
      }

      translation_dict["JPN"] = first_card.printed_name

      if (Object.keys(translation_dict).length == 2) {
        break
      }
    }

    return translation_dict
  }
}


module.exports = Scryfall
