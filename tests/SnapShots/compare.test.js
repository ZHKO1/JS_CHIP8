const puppeteer = require('puppeteer');
const expect = require('chai').expect;
const PNG = require('pngjs').PNG;
const fs = require('fs');
const HttpServer = require('http-server').HTTPServer;
const { SCREENSHOTS_GOLDEN, SCREENSHOTS, COMPAREDIFF, ROMARRAY } = require('./config.js');
const { takeScreenshot, compareScreenshot } = require('./util.js');



describe('👀 SCREENSHOTS are correct', function () {
  let httpServer, browser, page;

  before(async function () {
    httpServer = new HttpServer({
      root: process.cwd()
    });
    await httpServer.listen(3000);;
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS);
    if (!fs.existsSync(COMPAREDIFF)) fs.mkdirSync(COMPAREDIFF);
  });

  after((done) => {
    httpServer.close();
    done()
  });

  beforeEach(async function () {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterEach(() => browser.close());

  describe('test rom', function () {
    beforeEach(async function () {
      return page.setViewport({ width: 800, height: 600 });
    });

    ROMARRAY.forEach(rom => {
      it(rom, async function () {
        await takeScreenshot(page, rom, SCREENSHOTS);
        let {
          img1,
          img2,
          diff,
          numDiffPixels
        } = await compareScreenshot(SCREENSHOTS, SCREENSHOTS_GOLDEN, rom);
        expect(img1.width, 'image widths are the same').equal(img2.width);
        expect(img1.height, 'image heights are the same').equal(img2.height);
        if (numDiffPixels !== 0) {
          fs.writeFileSync(`${COMPAREDIFF}/${rom}.png`, PNG.sync.write(diff));
        }
        expect(numDiffPixels, 'number of different pixels').equal(0);
      });
    });
  });


});
