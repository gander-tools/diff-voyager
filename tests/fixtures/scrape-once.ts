import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { chromium } from 'playwright';
import { scrape } from '../../src/scraper';

const [snapshotDir] = process.argv.slice(2);

async function main(): Promise<void> {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<html lang="en"><head><title>Scrape Once</title></head><body></body></html>');
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address() as AddressInfo;
  const targetUrl = `http://127.0.0.1:${port}/page`;

  const browser = await chromium.launch();
  try {
    await scrape(browser, {
      url: targetUrl,
      version: 1,
      snapshotDir,
      config: {},
    });
    console.log('OK');
  } finally {
    await browser.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

main().catch((err) => {
  console.error('ERR', err);
  process.exitCode = 1;
});
