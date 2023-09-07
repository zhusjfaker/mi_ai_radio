import crypto from 'node:crypto';
import base64 from 'base64-js';

export function md5Hash(input) {
  const hash = crypto.createHash('md5');
  hash.update(input);
  return hash.digest('hex').toUpperCase();
}

export function ConverclientSign(input) {
  // 创建一个哈希对象，指定算法为 SHA-1
  const sha1Hash = crypto.createHash('sha1');
  // 将服务令牌转换为 utf-8 编码的字节并更新哈希
  sha1Hash.update(Buffer.from(input, 'utf-8'));
  // 计算哈希值的摘要并以十六进制字符串表示
  const digest = sha1Hash.digest();
  base64.fromByteArray(digest);
  return digest;
}
