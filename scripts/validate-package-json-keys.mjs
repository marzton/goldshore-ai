import { readFileSync } from 'node:fs';

const filePath = 'package.json';
const source = readFileSync(filePath, 'utf8');

let i = 0;
const duplicates = [];

function error(message) {
  throw new Error(`${message} at index ${i}`);
}

function skipWhitespace() {
  while (i < source.length && /\s/.test(source[i])) i += 1;
}

function parseString() {
  if (source[i] !== '"') error('Expected string opening quote');
  i += 1;
  let result = '';
  while (i < source.length) {
    const ch = source[i];
    if (ch === '"') {
      i += 1;
      return result;
    }
    if (ch === '\\') {
      i += 1;
      if (i >= source.length) error('Unexpected EOF in string escape');
      const esc = source[i];
      if (esc === 'u') {
        const code = source.slice(i + 1, i + 5);
        if (!/^[0-9a-fA-F]{4}$/.test(code)) error('Invalid unicode escape');
        result += String.fromCharCode(parseInt(code, 16));
        i += 5;
        continue;
      }
      const map = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
      if (!(esc in map)) error('Invalid escape character');
      result += map[esc];
      i += 1;
      continue;
    }
    result += ch;
    i += 1;
  }
  error('Unterminated string');
}

function parseLiteral(lit) {
  if (source.slice(i, i + lit.length) !== lit) error(`Expected literal ${lit}`);
  i += lit.length;
}

function parseNumber() {
  const match = source.slice(i).match(/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
  if (!match) error('Invalid number');
  i += match[0].length;
}

function parseArray(path) {
  i += 1; // [
  skipWhitespace();
  if (source[i] === ']') {
    i += 1;
    return;
  }
  let idx = 0;
  while (i < source.length) {
    parseValue(`${path}[${idx}]`);
    idx += 1;
    skipWhitespace();
    if (source[i] === ',') {
      i += 1;
      skipWhitespace();
      continue;
    }
    if (source[i] === ']') {
      i += 1;
      return;
    }
    error('Expected , or ] in array');
  }
  error('Unterminated array');
}

function parseObject(path) {
  i += 1; // {
  const seen = new Map();
  skipWhitespace();
  if (source[i] === '}') {
    i += 1;
    return;
  }
  while (i < source.length) {
    skipWhitespace();
    const key = parseString();
    const keyPath = path ? `${path}.${key}` : key;
    if (seen.has(key)) {
      duplicates.push({ path: path || '<root>', key, first: seen.get(key), second: keyPath });
    } else {
      seen.set(key, keyPath);
    }
    skipWhitespace();
    if (source[i] !== ':') error('Expected : after object key');
    i += 1;
    skipWhitespace();
    parseValue(keyPath);
    skipWhitespace();
    if (source[i] === ',') {
      i += 1;
      skipWhitespace();
      continue;
    }
    if (source[i] === '}') {
      i += 1;
      return;
    }
    error('Expected , or } in object');
  }
  error('Unterminated object');
}

function parseValue(path = '') {
  skipWhitespace();
  const ch = source[i];
  if (ch === '{') return parseObject(path);
  if (ch === '[') return parseArray(path);
  if (ch === '"') return parseString();
  if (ch === 't') return parseLiteral('true');
  if (ch === 'f') return parseLiteral('false');
  if (ch === 'n') return parseLiteral('null');
  return parseNumber();
}

try {
  parseValue('');
  skipWhitespace();
  if (i !== source.length) error('Unexpected trailing content');
} catch (err) {
  console.error(`❌ Failed to parse ${filePath}: ${err.message}`);
  process.exit(1);
}

if (duplicates.length > 0) {
  console.error(`❌ Duplicate JSON keys found in ${filePath}:`);
  for (const dup of duplicates) {
    console.error(`  - key "${dup.key}" in object path "${dup.path}"`);
  }
  process.exit(1);
}

console.log(`✅ No duplicate JSON keys found in ${filePath}.`);
