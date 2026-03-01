const fs = require('fs');

const path = 'packages/theme/index.ts';
let code = fs.readFileSync(path, 'utf8');

// The generic function to add
const genericSyncMotion = `
function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function onReducedMotionChange(cb: (reduce: boolean) => void) {
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.addEventListener("change", (e) => cb(e.matches));
}

function syncMotion(enable: () => void, disable: () => void) {
  const sync = (reduceMotion: boolean) => {
    if (reduceMotion) {
      disable();
    } else {
      enable();
    }
  };

  sync(prefersReducedMotion());
  onReducedMotionChange(sync);
}
`;

if (!code.includes('function syncMotion')) {
    code = code + '\n' + genericSyncMotion;
}

code = code.replace(/  const syncParallaxMotion = \(reduceMotion: boolean\) => \{\n    if \(reduceMotion\) \{\n      disableParallax\(\);\n      return;\n    \}\n\n    enableParallax\(\);\n  \};\n\n  syncParallaxMotion\(prefersReducedMotion\(\)\);\n  onReducedMotionChange\(syncParallaxMotion\);/g, '  syncMotion(enableParallax, disableParallax);');

code = code.replace(/  const syncTiltMotion = \(reduceMotion: boolean\) => \{\n    if \(reduceMotion\) \{\n      disableTilt\(\);\n      return;\n    \}\n\n    enableTilt\(\);\n  \};\n\n  syncTiltMotion\(prefersReducedMotion\(\)\);\n  onReducedMotionChange\(syncTiltMotion\);/g, '  syncMotion(enableTilt, disableTilt);');

fs.writeFileSync(path, code);
