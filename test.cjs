const path = require('node:path');
const Hareruya = require(path.join(path.dirname(require.main.filename), "util/hareruya.js"))
const ManaBox = require(path.join(path.dirname(require.main.filename), "util/manabox.js"))
const Moxfield = require(path.join(path.dirname(require.main.filename), "util/moxfield.js"))
const Curl = require(path.join(path.dirname(require.main.filename), "util/curl.js"))

const main = async () => {
  // const url = "https://www.hareruyamtg.com/decks/1249595"
  // const hr = await Hareruya.build(url);
  // console.log(hr.deck_list.join("\n"))

  // const url = "https://manabox.app/decks/AZzDJFK2cM-APshrGT_vcA"
  // const mb = await ManaBox.build(url);
  // console.log(mb)

  const url = "https://moxfield.com/decks/3g4hRaTj-0Gy3uiDFXu5qQ"
  const mf = await Moxfield.build(url);
  console.log(mf.deck_list.join("\n"))
};

main();

