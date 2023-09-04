import fetch from 'node-fetch';
import { getRandom, serviceLogin } from '../src/lib';

describe('MI OPEN API', () => {
  test.skip('test convers api', async () => {
    const device_id = '545137194';
    const user_id = '328902396';
    const method = 'player_play_operation';
    const service_path = 'mediaplayer';
    const payload = {
      deviceId: device_id,
      message: JSON.stringify({
        action: 'play',
        media: 'app_ios',
      }),
      method,
      path: service_path,
      requestId: `app_ios_${getRandom(30)}`,
    };
    const sid = 'micoapi';
    const reLogin = true;
    const url = 'https://api2.mina.mi.com/remote/ubus';

    const resp = (await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'MiHome/6.0.103 (com.xiaomi.mihome; build:6.0.103.1; iOS 14.4.0) Alamofire/6.0.103 MICO/iOSApp/appStore/6.0.103',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).catch((err) => {
      console.log(`Error: ${err.message} \n Stack: ${err.stack}`);
    })) as unknown as Response;
    if (resp.status === 200) {
      const json = await resp.json();
      console.log(json);
    }
  });

  test('get getRandom length', () => {
    const res = getRandom(16);
    expect(res.length).toBe(16);
  });

  test('test login api', async () => {
    const mi_login_json_result = await serviceLogin();
    expect(mi_login_json_result !== undefined).toBe(true);
    expect(mi_login_json_result.passToken !== undefined).toBe(true);
  });
});
