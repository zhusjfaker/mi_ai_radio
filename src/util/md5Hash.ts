import crypto from 'node:crypto';

export function md5Hash(input) {
  const hash = crypto.createHash('md5');
  hash.update(input);
  return hash.digest('hex').toUpperCase();
}

export function MiClientSign(nsec: string): string {
  const sha1Hash = crypto.createHash('sha1');
  // 将 nsec 编码后的字符串添加到哈希对象中
  sha1Hash.update(nsec, 'utf-8');
  // 计算哈希值并获取原始二进制数据
  const sha1Digest = sha1Hash.digest();
  // 使用 Buffer 对象进行 Base64 编码
  const clientSign = Buffer.from(sha1Digest).toString('base64');
  return clientSign;
}
