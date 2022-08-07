const KeyNumber = 16;
let Keyboard = {
  KeyboardArray: new Array(KeyNumber).fill(0),
  init() {
    this.reset();
  },
  getKey(i) {
    return this.KeyboardArray[i];
  },
  keyDown(i) {
    this.KeyboardArray[i] = 1;
   },
  keyUp(i) {
    this.KeyboardArray[i] = 0;
  },
  reset() {
    this.KeyboardArray = new Array(KeyNumber).fill(0)
  }
}

export default Keyboard;