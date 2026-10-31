const http = require('http');

async function test(id) {
  return new Promise((resolve) => {
    http.get(`http://localhost:8082/api/customers/${id}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (!data.includes('Not Found')) {
          console.log(`Found Customer ${id}:`, data);
        }
        resolve();
      });
    }).on('error', resolve);
  });
}

async function run() {
  for (let i = 1; i <= 20; i++) {
    await test(i);
  }
}
run();
