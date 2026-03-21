const he = require("he")

class ManaBox {
  constructor() {
    this.deck_list = null
  }
  
  static async build(deck_url) {
    const mb = new ManaBox()
    mb.deck_list = await mb.fetchDeckList(deck_url)

    return mb
  };

  async fetchDeckList(deck_url) {
    let result_list = []

    const url = deck_url

    const response = await fetch(url)
    
    let html = await response.text()
    html = he.decode(html);

    const regex = /"name":\[\s*0\s*,\s*"([^"]+)"\s*\][^{}]*?"boardCategory":\[\s*0\s*,\s*(0|3)\s*\]/g
    
    for (const match of html.matchAll(regex)) {
      const eng_name = match[1]
      result_list.push(eng_name);
    }
    
    return result_list
  }
}


module.exports = ManaBox
