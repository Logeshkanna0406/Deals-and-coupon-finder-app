const fs = require('fs');

const cmd = fs.readFileSync('C:\\Dev\\antigravity\\cashback_cmd.txt', 'utf8');
const match = cmd.match(/-classpath "(.*?)"/);
const cp = match[1].replace(/\\/g, '/');

const runArgs = [
  '-cp',
  `"${cp}"`,
  'com.example.cashbackservice.CashbackServiceApplication'
].join('\n');

fs.writeFileSync('C:\\Dev\\antigravity\\cashback_run_args.txt', runArgs, 'utf8');
console.log("Created cashback_run_args.txt");
