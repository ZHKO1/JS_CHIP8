import Chip8 from './chip8/index.js'

let chip8 = Object.create(Chip8);
chip8.init({
  container : "#chip8_container",
  selectButton : "#choose",
});
