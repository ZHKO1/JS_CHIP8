const puppeteer = require('puppeteer');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;
const fs = require('fs');

const HttpServer = require('http-server').HttpServer;

let screenshots_golden = __dirname + "/screenshots_golden"
let screenshots = __dirname + "/screenshots"

const roms = ["bc_test.ch8", "c8_test.c8", "test_opcode.ch8"];

async function init() {
  let browser, page;
  browser = await puppeteer.launch();
  let httpServer = new HttpServer({
    root: __dirname + '/server/'
  });
  await httpServer.listen(3000);
  for(let rom of roms){
    page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await takeAndCompareScreenshot(page, rom);    
  }
  await browser.close();
  await httpServer.close();
}
init();

async function takeAndCompareScreenshot(page, fileName) {
  await page.goto(`http://127.0.0.1:3000/index.html?name=${fileName}`);
  await new Promise((next) => {
    setTimeout(() => {
      next()
    }, 2000)
  });
  let $chip8_container = await page.$("#chip8");
  await $chip8_container.screenshot({ path: `${screenshots_golden}/${fileName}.png` });

  // await compareScreenshots("view1", "view2");
}
function compareScreenshots(fileName1, fileName2) {
  return new Promise((resolve, reject) => {
    const img1 = fs.createReadStream(`${testDir}/${fileName1}.png`).pipe(new PNG()).on('parsed', doneReading);
    const img2 = fs.createReadStream(`${testDir}/${fileName2}.png`).pipe(new PNG()).on('parsed', doneReading);

    let filesRead = 0;
    function doneReading() {
      if (++filesRead < 2) return;
      if(img1.width == img2.width){
        console.log("img1.width == img2.width");
      }
      if(img1.height == img2.height){
        console.log("img1.height == img2.height");
      }
      const diff = new PNG({ width: img1.width, height: img2.height });
      const numDiffPixels = pixelmatch(
        img1.data, img2.data, diff.data, img1.width, img1.height,
        { threshold: 0.1 });
      
      if(numDiffPixels == 0){
        console.log("numDiffPixels == 0");
      }
      console.log(numDiffPixels);
      fs.writeFileSync('diff.png', PNG.sync.write(diff));

      resolve();
    }
  });
}