const { rcedit } = require('rcedit');
const path = require('path');
const fs = require('fs');

async function patch() {
  const exePath = path.join(__dirname, '../dist/win-unpacked/Reco.exe');
  const iconPath = path.join(__dirname, '../asset/icon.ico');

  if (!fs.existsSync(exePath)) {
    console.error('Reco.exe not found at', exePath);
    return;
  }

  console.log('Stamping Reco.exe with custom icon and metadata...');
  await rcedit(exePath, {
    icon: iconPath,
    'product-version': '1.0.0',
    'file-version': '1.0.0',
    'version-string': {
      CompanyName: 'Hardik Prajapati',
      FileDescription: 'Reco Screen Recorder',
      ProductName: 'Reco',
      LegalCopyright: 'Copyright © 2026 Hardik Prajapati',
      OriginalFilename: 'Reco.exe'
    }
  });
  console.log('Successfully stamped Reco.exe with official Reco icon and metadata!');
}

patch().catch(err => {
  console.error('Failed to patch icon:', err);
  process.exit(1);
});
