const { execSync } = require('child_process');
const fs = require('fs');

const wmicOutput = execSync('wmic process where "ProcessId=19420" get CommandLine /format:list', { encoding: 'utf-8' });
// CommandLine=... -classpath <classpath> -XX...
const idx1 = wmicOutput.indexOf('-classpath ');
if (idx1 !== -1) {
  let rest = wmicOutput.substring(idx1 + '-classpath '.length);
  // find the next flag, usually -XX or -D
  const idx2 = rest.search(/\s+-[X|D]/);
  let cp = rest.substring(0, idx2).trim();
  if (cp.startsWith('"') && cp.endsWith('"')) {
    cp = cp.slice(1, -1);
  }
  fs.writeFileSync('C:/Dev/antigravity/cp_full.txt', cp);
  console.log('Full classpath length:', cp.length, 'entries:', cp.split(';').length);

  const targetDir = 'C:\\Dev\\Projects\\Deals and Coupons finder app-zip10\\Deals and Coupons finder app\\api-gateway\\target\\classes';
  const srcFile = 'C:\\Dev\\Projects\\Deals and Coupons finder app-zip10\\Deals and Coupons finder app\\api-gateway\\src\\main\\java\\com\\example\\apigateway\\filter\\AuthenticationFilter.java';

  const lines = [
    '-cp',
    `"${cp.replace(/\\/g, '\\\\')}"`,
    '-d',
    `"${targetDir.replace(/\\/g, '\\\\')}"`,
    `"${srcFile.replace(/\\/g, '\\\\')}"`
  ];
  fs.writeFileSync('C:/Dev/antigravity/javac_args.txt', lines.join('\n'));

  const javac = '"C:\\Program Files\\Java\\jdk-21.0.12.1\\bin\\javac.exe"';
  console.log('Compiling with @javac_args.txt...');
  execSync(`${javac} @C:\\Dev\\antigravity\\javac_args.txt`, { stdio: 'inherit' });
  console.log('Compilation succeeded!');
}
