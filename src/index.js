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
  },
  read(buffer) {
    this.cpu.read(Array.from(buffer)); 
  },
  run(frameCallback) {
    this.cpu.run(frameCallback); 
  },
  stop() {
    this.cpu.stop(); 
  },
  step() {
    this.cpu.manual_next();
  },
  getRegister(){
    return this.cpu.getRegister();
  },
  reset(){
    this.display.reset();
    this.cpu.reset();
    this.keyboard.reset();
  },
  keyDown(i){
    this.keyboard.keyDown(i);
  },
  keyUp(i){
    this.keyboard.keyUp(i);
  },
  
};

export default Chip8;