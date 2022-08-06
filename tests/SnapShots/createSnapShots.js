import puppeteer from 'puppeteer';
import { HTTPServer as HttpServer } from 'http-server';
import { takeScreenshot } from './util.js'
import { SCREENSHOTS_GOLDEN, SCREENSHOTS, ROMARRAY } from './config.js'

init();

async function init() {
  let httpServer, browser, page;
  browser = await puppeteer.launch();
  httpServer = new HttpServer({
    root: process.cwd()
  });
  await httpServer.listen(3000);
  for (let rom of ROMARRAY) {
    page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await takeScreenshot(page, rom, SCREENSHOTS_GOLDEN);
  }
  await browser.close();
  await httpServer.close();
}
