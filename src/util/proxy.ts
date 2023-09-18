import { HttpsProxyAgent } from 'https-proxy-agent';

export function proxyAgent() {
  const url = process.env['MI_API_PROXY_URL'];
  if (!url) {
    throw new Error('MI_API_PROXY_URL is not defined');
  }
  const proxyUrl = url;
  const proxyAgent = new HttpsProxyAgent(proxyUrl);
  return proxyAgent;
}
