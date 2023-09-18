import crypto from 'node:crypto';
import base64 from 'base64-js';
import zlib from 'node:zlib';
import { MiAccount } from './miaccount';

export class MiIOService {
  public account: MiAccount;
  public server: string;

  constructor(account: MiAccount, region: string | undefined) {
    this.account = account;
    this.server = `https://${
      !region || region !== 'cn' ? '' : `${region}.`
    }api.io.mi.com/app`;
  }

  public async miio_request(uri: string, data?: any) {
    const prepare_data = (
      token: Map<string, any>,
      cookies: Map<string, string>
    ) => {
      cookies.set('PassportDeviceId', token.get('deviceId'));
      return MiIOService.signData(uri, data, token.get('xiaomiio')?.[0]) as any;
    };

    const headers = {
      'User-Agent':
        'iOS-14.4-6.0.103-iPhone12,3--D7744744F7AF32F0544445285880DD63E47D9BE9-8816080-84A3F44E137B71AE-iPhone',
      'x-xiaomi-protocal-flag-cli': 'PROTOCAL-HTTP2',
    };

    const result = await this.account.mi_request(
      'xiaomiio',
      `${this.server}${uri}`,
      prepare_data,
      headers
    );

    if (result?.result) {
      return result.result;
    } else {
      throw new Error(
        `miio_request uri: ${uri} error: \n ${JSON.stringify(result, null, 2)}`
      );
    }
  }

  public async home_request(did: string, method: string, params: any) {
    const res = await this.miio_request('/home/rpc/' + did, {
      id: 1,
      method: method,
      accessKey: 'IOS00026747c5acafc2',
      params: params,
    });

    return res;
  }

  public async miot_request(cmd: string, params: any) {
    const res = await this.miio_request('/miotspec/' + cmd, { params: params });
    return res;
  }

  public static signNonce(ssecurity: string, nonce: string) {
    const m = crypto.createHash('sha256');
    m.update(base64.toByteArray(ssecurity));
    m.update(base64.toByteArray(nonce));
    const digest = m.digest();
    return base64.fromByteArray(digest);
  }

  public static signData(uri: string, data: any, ssecurity: string) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    const nonceBytes = Buffer.concat([
      crypto.randomBytes(8),
      Buffer.from(Math.floor(Date.now() / 60000).toString(16), 'hex'),
    ]);
    const nonce = base64.fromByteArray(nonceBytes);
    const snonce = MiIOService.signNonce(ssecurity, nonce);
    const msg = `${uri}&${snonce}&${nonce}&data=${data}`;
    const sign = crypto
      .createHmac('sha256', Buffer.from(base64.toByteArray(snonce)))
      .update(msg)
      .digest();
    return {
      _nonce: nonce,
      data: data,
      signature: base64.fromByteArray(sign),
    };
  }

  public static miotDecode(
    ssecurity: string,
    nonce: string,
    data: any,
    gzip = false
  ) {
    const signNonce = MiIOService.signNonce(ssecurity, nonce);
    const r = crypto.createCipheriv(
      'rc4',
      Buffer.from(base64.toByteArray(signNonce)),
      Buffer.alloc(0)
    );
    let decrypted = r.update(Buffer.from(base64.toByteArray(data)));
    decrypted = Buffer.concat([decrypted, r.final()]);

    if (gzip) {
      try {
        const decompressed = zlib.unzipSync(decrypted);
        decrypted = decompressed;
      } catch (error) {
        // 处理解压缩错误
        console.error('Failed to decompress data:', error);
      }
    }
    return JSON.parse(decrypted.toString());
  }
}
