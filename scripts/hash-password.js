const readline = require('readline');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl.question('Enter the admin password to hash: ', async (password) => {
  rl.close();
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  console.log('\nADMIN_PASSWORD_HASH=');
  console.log(hash);
});
