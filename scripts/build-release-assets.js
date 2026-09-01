const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

function getSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  return hash.digest('hex');
}

console.log('=== GENERATING RELEASE ASSETS ===\n');

const releaseDir = path.join(__dirname, '../release');
const binDir = path.join(__dirname, '../bin/win64');
const ffmpegExe = path.join(binDir, 'ffmpeg.exe');

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// 1. Generate RECO-FFmpeg-Essentials.zip
const zipDest = path.join(releaseDir, 'RECO-FFmpeg-Essentials.zip');
if (fs.existsSync(ffmpegExe)) {
  console.log('Creating optional GitHub Release asset: RECO-FFmpeg-Essentials.zip...');
  const tempPackDir = path.join(__dirname, '../temp_ffmpeg_pack');
  if (fs.existsSync(tempPackDir)) fs.rmSync(tempPackDir, { recursive: true, force: true });
  fs.mkdirSync(tempPackDir, { recursive: true });

  fs.copyFileSync(ffmpegExe, path.join(tempPackDir, 'ffmpeg.exe'));
  fs.writeFileSync(
    path.join(tempPackDir, 'version.json'),
    JSON.stringify(
      {
        version: '9.0.1-essentials',
        asset: 'RECO-FFmpeg-Essentials.zip',
        publishedAt: new Date().toISOString()
      },
      null,
      2
    )
  );

  if (fs.existsSync(zipDest)) fs.unlinkSync(zipDest);

  execSync(
    `powershell -Command "Compress-Archive -Path '${tempPackDir}\\*' -DestinationPath '${zipDest}' -CompressionLevel Optimal -Force"`,
    { stdio: 'inherit' }
  );

  fs.rmSync(tempPackDir, { recursive: true, force: true });

  const zipSizeMb = (fs.statSync(zipDest).size / (1024 * 1024)).toFixed(2);
  const zipSha = getSha256(zipDest);
  console.log(`✓ RECO-FFmpeg-Essentials.zip created successfully: ${zipSizeMb} MB`);
  console.log(`  SHA-256: ${zipSha}\n`);
} else {
  console.log('Note: bin/win64/ffmpeg.exe not found for zip generation.');
}

console.log('Release assets generation script ready.');
