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
  // Use try-catch with 'wx' flag to create file only if it doesn't exist, preventing TOCTOU race condition
  try {
    if (!fs.existsSync(path.dirname(file))) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
    }
    fs.writeFileSync(file, createTextPlaceholder(file), { flag: 'wx' });
    console.log('Created missing:', file);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
    // If it already exists, skip it
  }
}
