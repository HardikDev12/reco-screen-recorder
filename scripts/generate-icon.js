const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const pngToIco = require('png-to-ico');

async function generate() {
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const tempFiles = [];

  const tempDir = path.join(__dirname, '../temp_icons');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  for (const size of sizes) {
    const outPng = path.join(tempDir, `icon_${size}.png`);
    execSync(`ffmpeg -y -i "asset/icon.png" -vf "scale=${size}:${size}" "${outPng}"`, { stdio: 'ignore' });
    tempFiles.push(outPng);
  }

  console.log('Generating multi-layer icon.ico...');
  const buf = await pngToIco.default(tempFiles);
  fs.writeFileSync('asset/icon.ico', buf);
  console.log('Saved asset/icon.ico successfully (size:', buf.length, 'bytes)');

  // Clean up temp
  fs.rmSync(tempDir, { recursive: true, force: true });
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
