const fs = require('fs');
const path = require('path');

const required = [
  'packages/brand/logo-penrose.svg',
  'packages/brand/logo-horizontal.svg',
  'packages/brand/favicon.svg',
  'packages/brand/brand.json',
  'apps/gs-web/public/logo.svg',
  'apps/gs-admin/public/assets/logo.svg'
];

const createTextPlaceholder = (file) => {
  if (file.endsWith('.svg')) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#4da3ff"/></svg>\n';
  }

  if (file.endsWith('.json')) {
    return JSON.stringify(
      {
        name: 'Gold Shore Labs',
        primary_logo: 'logo-horizontal.svg',
        icon_logo: 'logo-penrose.svg',
      },
      null,
      2,
    ) + '\n';
  }

  return 'placeholder\n';
};

for (const file of required) {
  const dir = path.dirname(file);
  // mkdirSync with recursive: true is safe and doesn't throw if exists
  fs.mkdirSync(dir, { recursive: true });

  try {
    // Using 'wx' flag ensures the file is created ONLY if it doesn't exist.
    // This is the atomic way to handle this and avoids TOCTOU vulnerabilities.
    fs.writeFileSync(file, createTextPlaceholder(file), { flag: 'wx' });
    console.log('Created missing:', file);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error(`Error processing ${file}:`, error);
    }
    // EEXIST means the file already exists, which is the desired state.
  }
}
