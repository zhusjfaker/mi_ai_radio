import { MiAccount } from '../src/mi/miaccount';
import { MiNAService } from '../src/mi/minaservice';

describe('MI AI API', () => {
  test.skip('test get device list', async () => {
    const account = new MiAccount();
    const ai = new MiNAService(account);
    const res = await ai.device_list();
    console.log(res);
  }, 60000);
});
