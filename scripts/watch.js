require('esbuild').build({
  entryPoints: ['src/index.js'],
  outfile: 'dist/chip8.js',
  bundle: true,
  watch: {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
      else console.log('watch build succeeded:', result)
    },
  },
}).then(result => {
  // Call "stop" on the result when you're done
  // result.stop()
})