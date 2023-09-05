import fetch from 'node-fetch';
import fs from 'node:fs';
import path from 'node:path';
import { IMiToken } from '../type/itoken';
import { getRandom } from '../util/random';
import { md5Hash } from '../util/md5Hash';
import { createRequestBodySync } from '../util/body';

function getdiskToken(): IMiToken | undefined {
  const diskpath = path.join(__dirname, '../../token/mi_token.json');
  if (fs.existsSync(diskpath)) {
    const json = JSON.parse(fs.readFileSync(diskpath, 'utf-8'));
    return json;
  }
  return undefined;
}

function savediskToken(token: IMiToken): IMiToken {
  const diskpath = path.join(__dirname, '../../token/mi_token.json');
  fs.writeFileSync(diskpath, JSON.stringify(token, null, 2));
  return token;
}

/**
 * 登录小米账号
 * 两步验证方法
 * @returns
 */
async function serviceLogin(): Promise<IMiToken> {
  const token = getdiskToken();
  if (token) return token;
  let mi_login_json_result = undefined;
  const user_id = process.env['MI_USER'];
  if (!user_id) throw new Error('MI_USER is not defined');
  const password = process.env['MI_PASS'];
  if (!password) throw new Error('MI_PASS is not defined');
  const headers = {
    'User-Agent':
      'APP/com.xiaomi.mihome APPV/6.0.103 iosPassportSDK/3.9.0 iOS/14.4 miHSTS',
    'Content-Type': 'application/x-www-form-urlencoded',
    Cookie: `sdkVersion=${'3.9'};deviceId=${String(
      getRandom(16)
    ).toUpperCase()}`,
  };
  const url =
    'https://account.xiaomi.com/pass/serviceLogin?sid=xiaomiio&_json=true';

  const resp = (await fetch(url, {
    method: 'GET',
    headers,
  }).catch((err) => {
    console.log(`Error: ${err.message} \n Stack: ${err.stack}`);
  })) as unknown as Response;

  let json = undefined;
  if (resp.status === 200) {
    const res = await resp.text();
    json = JSON.parse(res.replace('&&&START&&&', '').replace('&&&END&&&', ''));
  }
  // 登录后 两步验证
  if (json) {
    const payload = {
      _json: 'true',
      qs: json.qs,
      sid: json.sid,
      _sign: json._sign,
      callback: json.callback,
      user: user_id,
      hash: md5Hash(password),
    };
    //'E02B6C1A0FE30FCA866559E5729E824C'
    //'https://sts.api.io.mi.com/sts'
    // console.log(`payload: \n ${JSON.stringify(payload, null, 2)}`);
    const url = 'https://account.xiaomi.com/pass/serviceLoginAuth2';
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    const resp = (await fetch(url, {
      method: 'POST',
      headers,
      body: createRequestBodySync(payload),
    }).catch((err) => {
      console.log(`Error: ${err.message} \n Stack: ${err.stack}`);
    })) as unknown as Response;

    if (resp.status === 200) {
      const res = await resp.text();
      json = JSON.parse(
        res.replace('&&&START&&&', '').replace('&&&END&&&', '')
      );
      mi_login_json_result = json;
      savediskToken(json);
    }
  }
  return mi_login_json_result;
}

export {
  serviceLogin,
  getdiskToken,
  savediskToken,
};
