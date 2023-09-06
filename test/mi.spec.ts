import { MiAccount } from '../src/mi/miaccount';
import { MiNAService } from '../src/mi/minaservice';
import { getRandom } from '../src/util/random';

describe('MI OPEN API', () => {
  test.skip('get getRandom length', () => {
    const res = getRandom(16);
    expect(res.length).toBe(16);
  });

  test.skip('test login api', async () => {
    const account = new MiAccount();
    await account.login('xiaomiio');
    expect(account.token !== undefined).toBe(true);
    expect(account.token.get('xiaomiio') !== undefined).toBe(true);
  }, 60000);

  test('test get device list', async () => {
    const account = new MiAccount();
    const ai = new MiNAService(account);
    const res = await ai.device_list();
    console.log(res);
  }, 60000);
});
