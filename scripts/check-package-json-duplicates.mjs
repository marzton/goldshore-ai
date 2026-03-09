#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const workspacePrefixes = ['apps/', 'packages/', 'infra/'];

function listWorkspacePackageJsonFiles() {
  const trackedFiles = execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);

  return trackedFiles.filter((file) => {
    if (!file.endsWith('package.json')) return false;
    if (file === 'package.json') return true;
    return workspacePrefixes.some((prefix) => file.startsWith(prefix));
  });
}

function findDuplicateScriptKeys(jsonText) {
  let i = 0;
  const duplicates = [];

  const skipWhitespace = () => {
    while (i < jsonText.length && /\s/.test(jsonText[i])) i += 1;
  };

  const error = (message) => {
    throw new Error(`${message} at index ${i}`);
  };

  const parseString = () => {
    if (jsonText[i] !== '"') error('Expected string');
    i += 1;
    let result = '';

    while (i < jsonText.length) {
      const ch = jsonText[i];
      if (ch === '"') {
        i += 1;
        return result;
      }

      if (ch === '\\') {
        i += 1;
        const esc = jsonText[i];
        if (!esc) error('Invalid escape sequence');
        if (esc === 'u') {
          const hex = jsonText.slice(i + 1, i + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) error('Invalid unicode escape');
          result += String.fromCharCode(Number.parseInt(hex, 16));
          i += 5;
          continue;
        }

        result += esc;
        i += 1;
        continue;
      }

      result += ch;
      i += 1;
    }

    error('Unterminated string');
  };

  const parseLiteral = (literal) => {
    if (jsonText.slice(i, i + literal.length) !== literal) error(`Expected ${literal}`);
    i += literal.length;
  };

  const parseNumber = () => {
    if (jsonText[i] === '-') i += 1;
    if (jsonText[i] === '0') {
      i += 1;
    } else {
      if (!/[1-9]/.test(jsonText[i])) error('Invalid number');
      while (/[0-9]/.test(jsonText[i])) i += 1;
    }

    if (jsonText[i] === '.') {
      i += 1;
      if (!/[0-9]/.test(jsonText[i])) error('Invalid number');
      while (/[0-9]/.test(jsonText[i])) i += 1;
    }

    if (jsonText[i] === 'e' || jsonText[i] === 'E') {
      i += 1;
      if (jsonText[i] === '+' || jsonText[i] === '-') i += 1;
      if (!/[0-9]/.test(jsonText[i])) error('Invalid number');
      while (/[0-9]/.test(jsonText[i])) i += 1;
    }
  };

  const parseArray = (pathSegments) => {
    if (jsonText[i] !== '[') error('Expected array');
    i += 1;
    skipWhitespace();

    if (jsonText[i] === ']') {
      i += 1;
      return;
    }

    let index = 0;
    while (i < jsonText.length) {
      parseValue([...pathSegments, String(index)]);
      index += 1;
      skipWhitespace();

      if (jsonText[i] === ',') {
        i += 1;
        skipWhitespace();
        continue;
      }
      if (jsonText[i] === ']') {
        i += 1;
        return;
      }

      error('Expected , or ] in array');
    }

    error('Unterminated array');
  };

  const parseObject = (pathSegments) => {
    if (jsonText[i] !== '{') error('Expected object');
    i += 1;
    skipWhitespace();

    const keys = [];

    if (jsonText[i] === '}') {
      i += 1;
    } else {
      while (i < jsonText.length) {
        const key = parseString();
        keys.push(key);
        skipWhitespace();
        if (jsonText[i] !== ':') error('Expected : after object key');
        i += 1;
        parseValue([...pathSegments, key]);
        skipWhitespace();

        if (jsonText[i] === ',') {
          i += 1;
          skipWhitespace();
          continue;
        }

        if (jsonText[i] === '}') {
          i += 1;
          break;
        }

        error('Expected , or } in object');
      }
    }

    if (pathSegments.join('.') === 'scripts') {
      const seen = new Set();
      for (const key of keys) {
        if (seen.has(key)) {
          duplicates.push(key);
        } else {
          seen.add(key);
        }
      }
    }
  };

  const parseValue = (pathSegments) => {
    skipWhitespace();
    const ch = jsonText[i];
    if (ch === '{') return parseObject(pathSegments);
    if (ch === '[') return parseArray(pathSegments);
    if (ch === '"') return parseString();
    if (ch === '-' || /[0-9]/.test(ch)) return parseNumber();
    if (ch === 't') return parseLiteral('true');
    if (ch === 'f') return parseLiteral('false');
    if (ch === 'n') return parseLiteral('null');
    error(`Unexpected token '${ch ?? 'EOF'}'`);
  };

  skipWhitespace();
  parseValue([]);
  skipWhitespace();
  if (i !== jsonText.length) error('Unexpected trailing content');

  return duplicates;
}

const duplicateEntries = [];

for (const file of listWorkspacePackageJsonFiles()) {
  const content = readFileSync(file, 'utf8');

  try {
    const duplicates = findDuplicateScriptKeys(content);
    for (const key of duplicates) {
      duplicateEntries.push({ file, key });
    }
  } catch (error) {
    console.error(`Failed to parse ${file}: ${error.message}`);
    process.exit(2);
  }
}

if (duplicateEntries.length > 0) {
  for (const duplicate of duplicateEntries) {
    console.error(`${duplicate.file}: duplicate script key '${duplicate.key}'`);
  }
  process.exit(1);
}

console.log('No duplicate keys found in package.json scripts objects.');
