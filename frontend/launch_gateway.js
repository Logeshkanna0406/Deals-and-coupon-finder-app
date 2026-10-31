const { spawn } = require('child_process');
const fs = require('fs');

const cp = fs.readFileSync('C:/Dev/antigravity/cp_full.txt', 'utf-8').trim();
const java = 'C:\\Program Files\\Java\\jdk-21.0.12.1\\bin\\java.exe';
const cwd = 'C:\\Dev\\Projects\\Deals and Coupons finder app-zip10\\Deals and Coupons finder app\\api-gateway';

const outLog = fs.openSync('C:/Dev/antigravity/gateway_out.log', 'w');
const errLog = fs.openSync('C:/Dev/antigravity/gateway_err.log', 'w');

const child = spawn(java, ['-cp', cp, 'com.example.apigateway.ApiGatewayApplication'], {
  cwd,
  detached: true,
  stdio: ['ignore', outLog, errLog]
});
child.unref();
console.log('Gateway started with PID:', child.pid);
