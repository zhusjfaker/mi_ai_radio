import fetch from 'node-fetch';

describe('MI OPEN API', () => {
  test.skip('test convers api', async () => {
    const timestamp = Math.floor(Date.now());
    const hardware = 'lx06';
    const device_id = '545137194';
    const user_id = '328902396';
    const service_token =
      'V1:DXmurwq2/R1BHTELu6obCXeYvoHxsM6jwn3usHz3A3F0PGVNOOKzhbT9ho8iMnWp71uktKIiFQLycjlR0vDmBa9gD2uH9/+PF7pPB0YWH/cmsBwUqJVC7dnlTuVqVNH0I3R0bvh8hcHb3u/eLGk6Z+wIN+PFn3HzfKzXNHgnC7WLIimx3chvtltxjcaaU9/agrlYk/AYSGFWUFdp8gflLLu5lUY1uVMWZtsMkLH/1mzotofX7RUR8SKIfbAJV8O/h70qOg8UPjiiaGWOrGePHvIHiNE8nncw/qGB4tFP0DQ=';

    const url = `https://userprofile.mina.mi.com/device_profile/v2/conversation?source=dialogu&hardware=${hardware}&timestamp=${timestamp}&limit=2`;
    // COOKIE_TEMPLATE = "deviceId={device_id}; serviceToken={service_token}; userId={user_id}"

    const resp = (await fetch(url, {
      method: 'GET',
      headers: {
        Cookie: `deviceId=${device_id}; serviceToken=${service_token}; userId=${user_id}`,
      },
    }).catch((err) => {
      console.log(`Error: ${err.message} \n Stack: ${err.stack}`);
    })) as unknown as Response;
    if (resp.status === 200) {
      const json = await resp.json();
      console.log(json);
    }
  });
});
