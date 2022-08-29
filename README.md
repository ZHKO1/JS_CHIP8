# JS-CHIP8
A Chip-8 emulator written in JavaScript.  
Try it here: https://js-chip8.netlify.app

## Usage
The simplest way to set up the emulator is the following code:

```js
let chip8 = Object.create(Chip8);
chip8.init({
  container: "#chip8_container",
});

// Load ROM file asynchronously...
fetch(`roms/${rom}`)
  .then(i => i.arrayBuffer())
  .then(async (buffer) => {
    const uint8View = new Uint8Array(buffer)
    chip8.read(uint8View);
    chip8.run();
  })

// Reset, Stop or Step
chip8.reset();
chip8.stop();
chip8.step();

// Catch keyboard events
let KeyboardMap = {
  "4": "ArrowLeft",
  "6": "ArrowRight",
};
document.onkeydown = (e) => {
  let key = e.key;
  for (let _0xKey in KeyboardMap) {
    if (KeyboardMap[_0xKey] == key) {
      chip8.keyDown(parseInt(_0xKey, 16));
    }
  }
}
document.onkeyup = (e) => {
  let key = e.key;
  for (let _0xKey in KeyboardMap) {
    if (KeyboardMap[_0xKey] == key) {
      chip8.keyUp(parseInt(_0xKey, 16));
    }
  }
}
```

## Browser Support
This emulator should work in any decent web browser supporting typed arrays and canvas element.

## Reference
- http://devernay.free.fr/hacks/chip8/C8TECH10.HTM
- https://rsj217.github.io/chip8-py/build/html/tutorial/01_chip8.html
- https://blog.scottlogic.com/2017/12/13/chip8-emulator-webassembly-rust.html
- https://www.taniarascia.com/writing-an-emulator-in-javascript-chip8/

## License
This project is open source and available under the [MIT License](LICENSE).