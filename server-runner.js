const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
const marker = path.join(__dirname, '.portfolio-restart');

function start(){
  const child = spawn(process.execPath, [serverPath], { stdio:'inherit', env:process.env });
  child.on('exit', (code, signal) => {
    const requestedRestart = fs.existsSync(marker);
    if(requestedRestart){
      try { fs.unlinkSync(marker); } catch {}
      setTimeout(start, 700);
      return;
    }
    process.exit(code ?? 0);
  });
}

start();
