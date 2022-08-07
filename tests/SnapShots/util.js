import { PNG } from 'pngjs';
import fs from 'fs';
import pixelmatch from 'pixelmatch';

async function takeScreenshot(page, fileName, path) {
  await page.goto(`http://127.0.0.1:3000/tests/SnapShots/test.html?name=${fileName}`);
  await new Promise((next) => {
    setTimeout(() => {
      next()
    }, 600)
  });
  let $chip8_container = await page.$("#chip8");
  await $chip8_container.screenshot({ path: `${path}/${fileName}.png` });
}

async function compareScreenshot(path_golden, path, fileName) {
  return new Promise((resolve, reject) => {
    const img1 = fs.createReadStream(`${path_golden}/${fileName}.png`).pipe(new PNG()).on('parsed', doneReading);
    const img2 = fs.createReadStream(`${path}/${fileName}.png`).pipe(new PNG()).on('parsed', doneReading);

    let filesRead = 0;
    function doneReading() {
      if (++filesRead < 2) return;
      const diff = new PNG({ width: img1.width, height: img2.height });
      const numDiffPixels = pixelmatch(
        img1.data, img2.data, diff.data, img1.width, img1.height,
        { threshold: 0.1 });
      resolve({
        img1,
        img2,
        diff,
        numDiffPixels
      });
    }
  });
}

export {
  takeScreenshot,
  compareScreenshot,
};