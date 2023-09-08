import { createRequestBodySync } from '../util/body';
import { MiClientSign, md5Hash } from '../util/md5Hash';
import { getRandom } from '../util/random';
import fetch from 'node-fetch';
import axios from 'axios';

export class MiAccount {
  public username: string;
  public password: string;
  public token: Map<string, any>;
  public fetch = fetch;

  constructor() {
    if (!process.env['MI_USER']) {
      throw new Error('MI_USER is not defined');
    }
    this.username = process.env['MI_USER'];
    if (!process.env['MI_PASS']) {
      throw new Error('MI_PASS is not defined');
    }
    this.password = process.env['MI_PASS'];
    this.token = new Map();
  }

  public async readStreamToString(
    stream: ReadableStream<Uint8Array>
  ): Promise<string> {
    let s: any = stream;
    return new Promise((resolve, reject) => {
      let data = '';
      s.on('data', (chunk) => {
        data += chunk.toString();
      });
      s.on('end', () => {
        resolve(data);
      });
    });
  }

  public setToken(key: string, value: any): void {
    this.token.set(key, value);
  }

  public getToken(key: string): string | undefined {
    return this.token.get(key);
  }

  public async login(sid: string) {
    if (this.getToken('deviceId') === undefined) {
      const val = String(getRandom(16)).toUpperCase();
      this.setToken('deviceId', val);
    }

    const resp = await this.serviceLogin(`serviceLogin?sid=${sid}&_json=true`);
    if (resp.code !== 0) {
      const payload = {
        _json: 'true',
        qs: resp.qs,
        sid: resp.sid,
        _sign: resp._sign,
        callback: resp.callback,
        user: this.username,
        hash: md5Hash(this.password),
      };
      const result = await this.serviceLogin('serviceLoginAuth2', payload);
      if (result.code !== 0) {
        throw new Error(
          `..... sid: ${sid}, serviceLoginAuth2 error ${result.description}`
        );
      } else {
        this.setToken('userId', result.userId);
        this.setToken('passToken', result.passToken);

        const serviceToken = await this.securityTokenService(
          sid,
          result.location,
          result.nonce,
          result.ssecurity
        );
        this.setToken(sid, [result.ssecurity, serviceToken]);
      }
    } else {
      throw new Error(
        `..... sid: ${sid}, serviceLogin error ${resp.description}`
      );
    }
  }

  public async serviceLogin(uri: string, data = null) {
    const headers = {
      'User-Agent':
        'APP/com.xiaomi.mihome APPV/6.0.103 iosPassportSDK/3.9.0 iOS/14.4 miHSTS',
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const cookie = new Map<string, string>();
    cookie.set('sdkVersion', '3.9');
    cookie.set('deviceId', this.token.get('deviceId'));
    if ('passToken' in this.token) {
      cookie.set('userId', this.token.get('userId'));
      cookie.set('passToken', this.token.get('passToken'));
    }
    const cookieStr = (() => {
      const list = Array.from(cookie.entries());
      let str = '';
      list.forEach(([k, v]) => {
        str += `${k}=${v};`;
      });
      return str;
    })();
    headers['Cookie'] = cookieStr;
    const url = `https://account.xiaomi.com/pass/${uri}`;
    const method = data === null ? 'GET' : 'POST';
    const response = await axios({
      method,
      url,
      data: data ? createRequestBodySync(data) : null,
      headers,
      httpsAgent: false,
    }).catch((err) => {
      throw new Error(
        `uri: \n ${uri} \n data: \n ${data} \n Error: \n ${err.message} \n Stack: \n ${err.stack}`
      );
    });
    const raw = response.data.slice(11);
    const resp = JSON.parse(raw);
    if (uri === 'serviceLoginAuth2') {
      const regex = /"nonce":\d+,/;
      const match = raw.match(regex);
      if (match) {
        resp.nonce = match[0].replace('"nonce":', '').replace(',', '');
      } else {
        throw new Error(`serviceLoginAuth2 error nonce not found!`);
      }
    }
    return resp;
  }

  public async securityTokenService(
    sid: string,
    location: string,
    nonce: string,
    ssecurity: string
  ): Promise<string> {
    const nsec = `nonce=${nonce}&${ssecurity}`;
    const clientSign = MiClientSign(nsec);
    let url =
      sid !== 'xiaomiio'
        ? `${location}&clientSign=${encodeURIComponent(clientSign)}`
        : location;
    console.log(`url: \n ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          // 'APP/com.xiaomi.mihome APPV/6.0.103 iosPassportSDK/3.9.0 iOS/14.4 miHSTS',
          'MISoundBox/1.4.0,iosPassportSDK/iOS-3.2.7 iOS/11.2.5',
        'Accept-Language': 'zh-cn',
        Connection: 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const serviceToken = (() => {
      if (response.headers['set-cookie']?.length > 0) {
        const cookies = response.headers['set-cookie'];
        const item = cookies.find((x) => {
          return x.includes('serviceToken=') === true;
        });
        if (item) {
          const serviceToken = item.split(';')[0].split('=')[1];
          return serviceToken;
        }
      }
      return undefined;
    })();
    if (!serviceToken) {
      throw new Error(`serviceToken is undefined \n ${response.data}`);
    }
    return serviceToken;
  }

  public async mi_request(
    sid: string,
    url: string,
    data: (
      token: Map<string, any>,
      cookies: Map<string, string>
    ) => Promise<any> | Map<string, any> | undefined | null,
    headers: any,
    relogin = true
  ): Promise<any> {
    let serviceToken = this.getToken(sid);
    if (!serviceToken) {
      await this.login(sid);
      serviceToken = this.getToken(sid)?.[1];
    }

    const cookie = new Map<string, string>();
    cookie.set('userId', this.getToken('userId'));
    cookie.set('serviceToken', serviceToken);

    let payload = await (async () => {
      if (typeof data === 'function') {
        return await data(this.token, cookie);
      } else if (data) {
        return Object.fromEntries(data);
      }
      return null;
    })();

    const method = data ? 'POST' : 'GET';

    const cookieStr = (() => {
      const list = Array.from(cookie.entries());
      let str = '';
      list.forEach(([k, v]) => {
        str += `${k}=${v};`;
      });
      return str;
    })();

    if (headers['Content-Type']) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    headers['Cookie'] = cookieStr;

    if (
      headers['Content-Type'] === 'application/x-www-form-urlencoded' &&
      payload
    ) {
      payload = createRequestBodySync(payload);
    } else if (headers['Content-Type'] === 'application/json' && payload) {
      payload = JSON.stringify(payload);
    }

    const res = (await this.fetch(url, {
      method,
      headers,
      body: data ? payload : null,
    }).catch((err) => {
      throw new Error(
        `sid: ${sid}; \n url: ${url}; \n function: ${'mi_request'}; \n Error: \n ${
          err.message
        } \n Stack: \n ${err.stack}`
      );
    })) as unknown as Response | undefined;

    if (res?.status === 401 && relogin) {
      this.token = new Map();
      return await this.mi_request(sid, url, data, headers, false);
    } else if (res?.status !== 200) {
      throw new Error(
        `sid: ${sid}; \n url: ${url}; \n function: ${'mi_request'}; \n request_status: ${res?.status};`
      );
    } else {
      const final_res = await res.json();
      if (final_res.code === 0) {
        return final_res;
      } else {
        const msg = String(final_res['message']).toLowerCase();
        if (msg.includes('auth')) {
          this.token = new Map();
          return await this.mi_request(sid, url, data, headers, false);
        }
      }
    }
  }
}
