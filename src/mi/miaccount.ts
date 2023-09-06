import { createRequestBodySync } from '../util/body';
import { md5Hash } from '../util/md5Hash';
import { getRandom } from '../util/random';
import fetch from 'node-fetch';
import crypto from 'node:crypto';

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

  public async serviceLogin(uri: string, data?: any): Promise<any> {
    const cookie = new Map<string, string>();
    cookie.set('sdkVersion', '3.9');
    cookie.set('deviceId', this.getToken('deviceId'));

    const login_info = this.getToken('passToken');
    if (login_info) {
      cookie.set('passToken', login_info);
      cookie.set('userId', this.getToken('userId'));
    }
    const cookieStr = (() => {
      const list = Array.from(cookie.entries());
      let str = '';
      list.forEach(([k, v]) => {
        str += `${k}=${v};`;
      });
      return str;
    })();

    const headers = {
      'User-Agent':
        'APP/com.xiaomi.mihome APPV/6.0.103 iosPassportSDK/3.9.0 iOS/14.4 miHSTS',
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieStr,
    };

    const url = 'https://account.xiaomi.com/pass/' + uri;

    const resp = (await this.fetch(url, {
      method: data ? 'POST' : 'GET',
      headers,
      body: data ? createRequestBodySync(data) : null,
    }).catch((err) => {
      throw new Error(
        `uri: \n ${uri} \n data: \n ${data} \n Error: \n ${err.message} \n Stack: \n ${err.stack}`
      );
    })) as unknown as Response | undefined;

    if (resp && resp.status == 200) {
      const res = await resp.text();
      const json = JSON.parse(
        res.replace('&&&START&&&', '').replace('&&&END&&&', '')
      );
      return json;
    } else {
      throw new Error(
        `uri ${uri} request status is not 200 is ${resp?.status}`
      );
    }
  }

  public async securityTokenService(
    location: string,
    nonce: number,
    ssecurity: string
  ): Promise<string | undefined> {
    const nsec = 'nonce=' + String(nonce) + '&' + ssecurity;
    const sha1Hash = crypto.createHash('sha1').update(nsec, 'utf8').digest();
    const clientSign = sha1Hash.toString('base64');
    const url = `${location}&clientSign=${encodeURIComponent(clientSign)}`;
    const resp = (await this.fetch(url, { method: 'GET' }).catch((err) => {
      throw new Error(
        `url: \n ${url} \n function: \n ${'securityTokenService'} \n Error: \n ${
          err.message
        } \n Stack: \n ${err.stack}`
      );
    })) as unknown as Response | undefined;
    if (resp!.headers.get('set-cookie')) {
      const respCookies = resp!.headers.get('set-cookie').split(';');
      const response_cookie_map = new Map<string, string>();
      respCookies.forEach((cookie) => {
        const [key, value] = cookie.split('=');
        response_cookie_map.set(key, value);
      });
      const serviceToken = response_cookie_map.get('serviceToken');
      if (!serviceToken) {
        const responseText = await resp?.text();
        throw new Error(`serviceToken is undefined \n ${responseText}`);
      }
      return serviceToken;
    } else {
      return undefined;
    }
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
      serviceToken = this.getToken(sid);
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
