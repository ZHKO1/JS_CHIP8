const KeyboardMap = {
  "0": "x",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "q",
  "5": "w",
  "6": "e",
  "7": "a",
  "8": "s",
  "9": "d",
  "A": "z",
  "B": "c",
  "C": "4",
  "D": "r",
  "E": "f",
  "F": "v",
};

let Keyboard = {
  isKeyDown: false,
  currentKey_0x: null,
  init() {
    document.onkeydown = this.listen.bind(this);
    document.onkeyup = (e) => {
      this.isKeyDown = false;
      this.currentKey_0x = null;
    }
  },
  listen(e) {
    let key = e.key;
    for (let _0xKey in KeyboardMap) {
      if (KeyboardMap[_0xKey] == key) {
        this.isKeyDown = true;
        this.currentKey_0x = _0xKey;
      }
    }
  },
  getCurrentStatus() {
    return [this.isKeyDown, parseInt(this.currentKey_0x, 16)]
  },
  waitKeyDown() {
    return new Promise((next) => {
      document.onkeydown = (e) => {
        let key = e.key;
        for (let _0xKey in KeyboardMap) {
          if (KeyboardMap[_0xKey] == key) {
            this.isKeyDown = true;
            this.currentKey_0x = _0xKey;
            next(parseInt(this.currentKey_0x, 16));
            document.onkeydown = this.listen.bind(this);
            this.isKeyDown = false;
            this.currentKey_0x = null;
          }
        }
      };
    })
  },
  reset(){
    this.isKeyDown = false;
    this.currentKey_0x = null;
  }
}

export default Keyboard;