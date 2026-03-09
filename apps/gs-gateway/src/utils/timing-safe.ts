export const timingSafeCompare = (a?: string, b?: string): boolean => {
  const left = typeof a === 'string' ? a : '';
  const right = typeof b === 'string' ? b : '';

  const maxLength = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;

  for (let i = 0; i < maxLength; i += 1) {
    const leftCode = i < left.length ? left.charCodeAt(i) : 0;
    const rightCode = i < right.length ? right.charCodeAt(i) : 0;
    mismatch |= leftCode ^ rightCode;
  }

  return mismatch === 0 && left.length > 0 && right.length > 0;
};
