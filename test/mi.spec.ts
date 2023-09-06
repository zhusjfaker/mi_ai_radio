import { MiAccount } from '../src/mi/miaccount';
import { getRandom } from '../src/util/random';

describe('MI OPEN API', () => {
  test('get getRandom length', () => {
    const res = getRandom(16);
    expect(res.length).toBe(16);
  });

  test('test login api', async () => {
    const account = new MiAccount();
    await account.login('xiaomiio');
    expect(account.token !== undefined).toBe(true);
    expect(account.token.get('xiaomiio') !== undefined).toBe(true);
  }, 60000);
});
