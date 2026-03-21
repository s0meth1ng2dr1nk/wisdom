const { PythonShell } = require('python-shell');

class Curl {
  constructor() {
    this.response = null
  }
  
  static async build(url) {
    const cu = new Curl()
    cu.response = await cu.fetchUrl(url)

    return cu
  };

  async fetchUrl(url) {
    let result = ''

    const pyscript = `
import curl_cffi
print(curl_cffi.get("${url}", impersonate="chrome").text)
`
    const response_list = await PythonShell.runString(pyscript, null);
    console.log(response_list.join("\n"))
    result = response_list[0]

    return result
  }
}


module.exports = Curl
