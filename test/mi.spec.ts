import { MiAccount } from '../src/mi/miaccount';
import { MiNAService } from '../src/mi/minaservice';
import { MiClientSign } from '../src/util/md5Hash';
import { getRandom } from '../src/util/random';

describe('MI OPEN API', () => {
  const account: MiAccount = new MiAccount();
  const ai = new MiNAService(account);

  beforeAll(async () => {
    await account.login('xiaomiio');
  });

  test('get getRandom length', () => {
    const res = getRandom(16);
    expect(res.length).toBe(16);
  });

  test('test get sign', () => {
    const nonce = '249494511177612288';
    const ssecurity = '7CeUyF3glpd8nrF/SgXFFQ==';
    const nsec = `nonce=${nonce}&${ssecurity}`;
    expect(nsec === 'nonce=249494511177612288&7CeUyF3glpd8nrF/SgXFFQ==').toBe(
      true
    );
    const clientSign = 'jN3AcB7NvzW6uwW7HOuYO6Gcg9k=';
    const python_uri_encode = 'jN3AcB7NvzW6uwW7HOuYO6Gcg9k%3D';
    const result = MiClientSign(nsec);
    expect(result === clientSign).toBe(true);
    expect(encodeURIComponent(result) === python_uri_encode).toBe(true);
  });

  test('test login api', async () => {
    expect(account.token !== undefined).toBe(true);
    expect(account.token.get('xiaomiio') !== undefined).toBe(true);
    console.log(account.token.get('xiaomiio'));
  }, 60000);

  test('test get device list', async () => {
    const res = await ai.device_list();
    expect(res.length > 0).toBe(true);
  }, 60000);

  test('test text_to_speech', async () => {
    const account = new MiAccount();
    const ai = new MiNAService(account);
    const deviceId = await ai.device();
    const res = await ai.text_to_speech(deviceId, '你好今天星期四');
    console.log(res);
  }, 60000);

  test('test radio play', async () => {
    const deviceId = await ai.device();
    if (deviceId) {
      const res = await ai.player_set_status(deviceId, 'play');
      console.log(res);
    }
  }, 60000);

  test('test radio pause', async () => {
    const deviceId = await ai.device();
    if (deviceId) {
      const res = await ai.player_set_status(deviceId, 'pause');
      console.log(res);
    }
  }, 60000);

  test('test get last ask content', async () => {
    const result = await ai.get_radio_last_ask();
    console.log(JSON.stringify(result, null, 2));
  }, 60000);
});
