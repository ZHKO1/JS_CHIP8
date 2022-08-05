const puppeteer = require('puppeteer');
const PNG = require('pngjs').PNG;
const fs = require('fs');
const HttpServer = require('http-server').HttpServer;
const { takeScreenshot } = require('./util.js');
const { SCREENSHOTS_GOLDEN, SCREENSHOTS, ROMARRAY } = require('./config.js');

init();

async function init() {
  let browser, page;
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
