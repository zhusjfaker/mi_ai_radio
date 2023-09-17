import { HttpsProxyAgent } from 'https-proxy-agent';

export function proxyAgent() {
  const proxyHost = `192.168.5.1`;
  const proxyPort = 6666;
  const proxyUrl = `http://${proxyHost}:${proxyPort}`;
  const proxyAgent = new HttpsProxyAgent(proxyUrl);
  return proxyAgent;
}
