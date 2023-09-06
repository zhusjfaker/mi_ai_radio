import url from 'node:url';

export function createRequestBodySync(data) {
  const encodedData = new url.URLSearchParams(data);
  return encodedData.toString();
}
