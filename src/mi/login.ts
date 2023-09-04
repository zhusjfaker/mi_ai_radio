import fetch from 'node-fetch';
import crypto from 'node:crypto';
import querystring from 'querystring';

function createRequestBodySync(data) {
  const encodedData = querystring.stringify(data);
  return Buffer.from(encodedData);
}

function getRandom(length) {
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

function md5Hash(input) {
  const hash = crypto.createHash('md5');
  hash.update(input);
  return hash.digest('hex').toUpperCase();
}

/**
 * 登录小米账号
 * 两步验证方法
 * @returns
 */
async function serviceLogin() {
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
    }
  }

  return mi_login_json_result;
}

export { createRequestBodySync, getRandom, md5Hash, serviceLogin };
