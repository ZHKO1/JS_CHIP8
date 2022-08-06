import esbuild from 'esbuild';
import fs from 'fs';

esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: "esm",
  outfile: 'dist/chip8.js',
}).then(() => {
  copy("dist/chip8.js", "web/chip8.js", (e) => {
    copy("dist/chip8.js.map", "web/chip8.js.map", (e) => {
    })
  })
}).catch((e) => {
  process.exit(1)
});

function copy(src, dest, callback) {
  fs.copyFile(src, dest, (e) => {
    callback()
  })
}