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

for (const file of required) {
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const content = file.endsWith('.svg')
      ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#4da3ff"/></svg>\n'
      : file.endsWith('.json')
        ? '{}\n'
        : 'placeholder\n';
    fs.writeFileSync(file, content);
    console.log('Created missing:', file);
  }
}
