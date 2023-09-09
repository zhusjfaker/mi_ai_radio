import { getRandom } from '../util/random';
import { MiAccount } from './miaccount';

export class MiNAService {
  public account: MiAccount;

  constructor(account: MiAccount) {
    this.account = account;
  }

  public async mina_request(uri: string, data?: any) {
    const requestId = 'app_ios_' + getRandom(30);
    if (data) {
      if (data instanceof Map) {
        data.set('requestId', requestId);
      } else {
        data.requestId = requestId;
      }
    } else {
      uri += '&requestId=' + requestId;
    }

    const headers = {
      'User-Agent':
        'MiHome/6.0.103 (com.xiaomi.mihome; build:6.0.103.1; iOS 14.4.0) Alamofire/6.0.103 MICO/iOSApp/appStore/6.0.103',
    };

    const payload: any = data
      ? data instanceof Map
        ? data
        : new Map(Object.entries(data))
      : undefined;

    const resp = await this.account.mi_request(
      'micoapi',
      'https://api2.mina.mi.com' + uri,
      payload,
      headers
    );

    return resp;
  }

  public async device_list(master = 0) {
    const result = await this.mina_request(
      '/admin/v2/device_list?master=' + String(master)
    );
    return result?.data;
  }

  public async device(): Promise<string | undefined> {
    const devices = await this.device_list();
    const deviceId = process.env.MI_DID;
    if (deviceId) {
      const id = devices?.find((d: any) => d.miotDID === deviceId)?.deviceID;
      return id;
    } else {
      throw new Error('env MI_DID is undefined');
    }
  }

  public async ubus_request(
    deviceId: string,
    method: string,
    path: string,
    message: any
  ) {
    let msg = JSON.stringify(message);
    const result = await this.mina_request('/remote/ubus', {
      deviceId: deviceId,
      message: msg,
      method: method,
      path: path,
    });
    return result;
  }

  public async text_to_speech(deviceId: string, text: string) {
    const result = await this.ubus_request(
      deviceId,
      'text_to_speech',
      'mibrain',
      { text: text }
    );
    return result;
  }

  public async player_get_status(deviceId: string) {
    const res = await this.ubus_request(
      deviceId,
      'player_get_play_status',
      'mediaplayer',
      { media: 'app_ios' }
    );
    return res;
  }

  public async player_set_status(deviceId: string, status: 'play' | 'pause') {
    const res = await this.ubus_request(
      deviceId,
      'player_play_operation',
      'mediaplayer',
      { action: status, media: 'app_ios' }
    );
    return res;
  }
}
