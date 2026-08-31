const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function ensureFFmpeg() {
  const binDir = path.join(__dirname, '../bin/win64');
  const ffmpegExe = path.join(binDir, 'ffmpeg.exe');
  const ffprobeExe = path.join(binDir, 'ffprobe.exe');

  if (fs.existsSync(ffmpegExe) && fs.existsSync(ffprobeExe)) {
    console.log('FFmpeg binaries already present at', binDir);
    return;
  }

  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  console.log('Downloading static FFmpeg release for packaging...');
  const zipPath = path.join(__dirname, '../ffmpeg.zip');
  const tempExtract = path.join(__dirname, '../ffmpeg_temp');

  const url = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';

  execSync(`curl.exe -L -o "${zipPath}" "${url}"`, { stdio: 'inherit' });
  execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempExtract}' -Force"`, { stdio: 'inherit' });

  // Locate ffmpeg.exe & ffprobe.exe in extracted folder
  const findFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(findFiles(full));
      } else if (file === 'ffmpeg.exe' || file === 'ffprobe.exe') {
        results.push(full);
      }
    }
    return results;
  };

  const found = findFiles(tempExtract);
  for (const src of found) {
    const dest = path.join(binDir, path.basename(src));
    fs.copyFileSync(src, dest);
    console.log('Copied', src, '->', dest);
  }

  fs.rmSync(zipPath, { force: true });
  fs.rmSync(tempExtract, { recursive: true, force: true });
  console.log('FFmpeg setup completed successfully.');
}

ensureFFmpeg();
