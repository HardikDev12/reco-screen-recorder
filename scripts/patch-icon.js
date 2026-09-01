const { rcedit } = require('rcedit');
const path = require('path');
const fs = require('fs');

async function patch() {
  const possiblePaths = [
    path.join(__dirname, '../release/win-unpacked/Reco.exe'),
    path.join(__dirname, '../dist/win-unpacked/Reco.exe')
  ];
  const exePath = possiblePaths.find(p => fs.existsSync(p));
  const iconPath = path.join(__dirname, '../asset/icon.ico');

  if (!exePath) {
    console.error('Reco.exe not found in release or dist directories.');
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
