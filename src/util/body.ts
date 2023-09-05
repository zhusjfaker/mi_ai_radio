import querystring from 'querystring';

export function createRequestBodySync(data) {
  const encodedData = querystring.stringify(data);
  return Buffer.from(encodedData);
}
