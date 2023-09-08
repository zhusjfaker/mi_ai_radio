import { MiAccount } from '../src/mi/miaccount';
import { MiNAService } from '../src/mi/minaservice';
import { MiClientSign } from '../src/util/md5Hash';
import { getRandom } from '../src/util/random';

describe('MI OPEN API', () => {
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
    const account = new MiAccount();
    await account.login('xiaomiio');
    expect(account.token !== undefined).toBe(true);
    expect(account.token.get('xiaomiio') !== undefined).toBe(true);
    console.log(account.token.get('xiaomiio'));
  }, 60000);

  test('test get device list', async () => {
    const account = new MiAccount();
    const ai = new MiNAService(account);
    const res = await ai.device_list();
    expect(res.length > 0).toBe(true);
  }, 60000);
});
