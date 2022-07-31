import Display from "./display.js";
import CPU from "./cpu.js";
import Keyboard from "./keyboard.js";

// TODO 
// 1. 更多指令
// 2. 键盘事件
// 4. 循环刷新屏幕逻辑
// 5. 两个定时器 延时 和 声音

let Chip8 = {
  display: null,
  cpu: null,
  keyboard: null,
  init(options) {
    let { container, selectButton } = options;
    this.container = container;
    this.selectButton = selectButton;
    this.initReader();
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
  initReader() {
    let self = this;
    let $selectButton = document.querySelector(this.selectButton);
    $selectButton.addEventListener("click", function(){
      chooseFile();
    });
    function chooseFile(){
      let $input = document.createElement("input"); 
      $input.setAttribute("type", "file");
      $input.setAttribute("style", "visibility:hidden");
      document.body.appendChild($input);
      $input.addEventListener("change", (e) => {
        let files = e.target.files;
        const reader = new FileReader();
        reader.readAsArrayBuffer(files[0]);
        reader.onload = () => {
          const buffer = new Uint8Array(reader.result);
          self.cpu.read(buffer); 
          self.cpu.run();
        }
      });
      $input.click();
    }
  }
};

export default Chip8;