require("esbuild")
  .serve(
    {
      servedir: "web",
      port: 8000,
      host: "localhost"
    },
    {
      entryPoints: ['src/index.js'],
      outfile: "web/chip8.js",
      bundle: true,
      format: "esm",
    }
  )
  .then((server) => {
    console.log("Server is running at: http://localhost:8000/")
    // server.stop();
  });