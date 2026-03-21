const path = require('node:path');
const Curl = require(path.join(path.dirname(require.main.filename), "util/curl.js"))

class Moxfield {
  constructor() {
    this.deck_list = null
  }
  
  static async build(deck_url) {
    const mf = new Moxfield()
    mf.deck_list = await mf.fetchDeckList(deck_url)

    return mf
  };

  async fetchDeckList(deck_url) {
    let result_list = []

    const deck_id = deck_url.slice(deck_url.indexOf("/deck")).split("/")[2]
    const url = `https://api.moxfield.com/v2/decks/all/${deck_id}`
   
    const cu = await Curl.build(url)
    const json =  JSON.parse(cu.response)

    const commanders = Object.values(json.commanders || {}).map(c => c.card.name)
    const mainboard = Object.values(json.mainboard || {}).map(c => c.card.name)
    
    result_list = [...commanders, ...mainboard]
    
    return result_list
  }
}


module.exports = Moxfield
