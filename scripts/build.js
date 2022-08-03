require('esbuild').build({
  entryPoints: ['src/index.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: "esm",
  outfile: 'web/chip8.js',
}).catch(() => process.exit(1))