import fetch from 'node-fetch';

describe('MI device API', () => {
  test.skip('test get device list', async () => {
    const url = '/home/device_list';
    const headers = {
      'User-Agent':
        'iOS-14.4-6.0.103-iPhone12,3--D7744744F7AF32F0544445285880DD63E47D9BE9-8816080-84A3F44E137B71AE-iPhone',
      'x-xiaomi-protocal-flag-cli': 'PROTOCAL-HTTP2',
      Cookie: `userId=${''};`,
    };
  }, 60000);
});
