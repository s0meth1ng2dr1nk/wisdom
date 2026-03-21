const cheerio = require("cheerio")

class Hareruya {
  constructor() {
    this.deck_list = null
  }
  
  static async build(deck_url) {
    const hr = new Hareruya()
    hr.deck_list = await hr.fetchDeckList(deck_url)

    return hr
  };

  async fetchDeckList(deck_url) {
    let result_list = []

    const deck_id = deck_url.slice(deck_url.indexOf("/deck")).split("/")[2]
    const url = `https://www.hareruyamtg.com/ja/deck/bulk/${deck_id}`

    const response = await fetch(url)
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const count_card_list = $('.deckBuyAll__areaWrapper textarea[name="card_list"]').text().split('\n');
    
    for (let count_card of count_card_list) {
      count_card = count_card.trim();

      if (count_card.length == 0) {
        continue
      }

      if (count_card.toLowerCase() == 'sideboard') {
        break
      }

      const eng_name = count_card.slice(count_card.indexOf(" ") + 1);
      result_list.push(eng_name)
    }
    
    return result_list
  }
}


module.exports = Hareruya
