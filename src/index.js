import Display from "./display.js";
import CPU from "./cpu.js";
import Keyboard from "./keyboard.js";

let Chip8 = {
  display: null,
  cpu: null,
  keyboard: null,
  init(options) {
    let { container, selectButton } = options;
    this.container = container;
    this.selectButton = selectButton;
    this.initDisplay();
    this.initKeyboard();
    this.initCpu();
  },
  initDisplay() {
    this.display = Object.create(Display);
    this.display.init(this.container);
  },
  initKeyboard() {
    this.keyboard = Object.create(Keyboard);
    this.keyboard.init();
  },
  initCpu() {
    this.cpu = Object.create(CPU);
    this.cpu.init(this.display, this.keyboard);
    // this.cpu.run();
  },
  read(buffer) {
    this.cpu.read(Array.from(buffer)); 
  },
  run() {
    this.cpu.run(); 
  },
  stop() {
    this.cpu.stop(); 
  },
  step() {
    this.cpu.manual_next();
  },
  getRegister(){
    return this.cpu.getRegister();
  }
};

export default Chip8;