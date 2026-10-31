const fs = require('fs');
const { execSync } = require('child_process');

const cmd = fs.readFileSync('C:\\Dev\\antigravity\\cashback_cmd.txt', 'utf8');
const match = cmd.match(/-classpath "(.*?)"/);
if (!match) {
  console.error("Classpath not found");
  process.exit(1);
}
const cp = match[1].replace(/\\/g, '/');

const javacArgs = [
  '-cp',
  `"${cp}"`,
  '-d',
  '"C:/Dev/Projects/Deals and Coupons finder app-zip10/Deals and Coupons finder app/cashback-service/target/classes"',
  '"C:/Dev/Projects/Deals and Coupons finder app-zip10/Deals and Coupons finder app/cashback-service/src/main/java/com/example/cashbackservice/repository/PointTransactionRepository.java"',
  '"C:/Dev/Projects/Deals and Coupons finder app-zip10/Deals and Coupons finder app/cashback-service/src/main/java/com/example/cashbackservice/service/CashbackService.java"'
].join('\n');

fs.writeFileSync('C:\\Dev\\antigravity\\cashback_javac_args.txt', javacArgs, 'utf8');

console.log("Compiling cashback-service files...");
try {
  execSync('"C:\\Program Files\\Java\\jdk-21.0.12.1\\bin\\javac.exe" @C:\\Dev\\antigravity\\cashback_javac_args.txt', { stdio: 'inherit' });
  console.log("Successfully compiled cashback-service classes!");
} catch (e) {
  console.error("Compilation error:", e.message);
  process.exit(1);
}
