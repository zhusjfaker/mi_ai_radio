import crypto from 'node:crypto';

export function md5Hash(input) {
  const hash = crypto.createHash('md5');
  hash.update(input);
  return hash.digest('hex').toUpperCase();
}