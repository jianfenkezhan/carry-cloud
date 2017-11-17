const superagent = require("superagent");


module.exports = function request(options) {
	let { url, method, params, headers } = options;
  method = method ? method : 'get';
  let timeout = 16000;

  if (!headers) {
    headers = {};
  }

  return new Promise((resolve, reject) => {
    superagent
      [method](url)
      .set(headers)[method === 'get' ? 'query' : 'send'](params)
      .withCredentials()
      .timeout(timeout)
      .end((err, res) => {
        if(err) {
          reject(err);
        }
        res = res.body || JSON.parse(res.text);
        resolve(res);
      })
  })
}
