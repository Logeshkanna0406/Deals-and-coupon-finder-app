const http = require('http');

const urls = [
  'http://localhost:8088/api/points/customer/3',
  'http://localhost:8088/api/points/customer/3/tier',
  'http://localhost:8088/api/points/customer/3/transactions',
  'http://localhost:8088/api/cashback/wallet/3',
  'http://localhost:8088/api/cashback/transactions/3',
  'http://localhost:8087/api/redemptions/customer/3'
];

async function get(url) {
  return new Promise(resolve => {
    http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log(`=== ${url} (status: ${res.statusCode}) ===`);
        console.log(d);
        resolve();
      });
    }).on('error', err => {
      console.log(`=== ${url} ERROR: ${err.message} ===`);
      resolve();
    });
  });
}

async function run() {
  for (const u of urls) await get(u);
}
run();
