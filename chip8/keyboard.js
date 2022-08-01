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

let isKeyDown = false;
// 当前按键 对应的十六键值
let current0xKey = null;

let Keyboard = {
  init() {
    document.onkeydown = this.listen;
    document.onkeyup = (e) => {
      isKeyDown = false;
      current0xKey = null;
    }
  },
  listen(e) {
    let key = e.key;
    for (let _0xKey in KeyboardMap) {
      if (KeyboardMap[_0xKey] == key) {
        isKeyDown = true;
        current0xKey = _0xKey
      }
    }
  },
  getCurrentStatus() {
    return [isKeyDown, parseInt(current0xKey, 16)]
  },
  waitKeyDown() {
    return new Promise((next) => {
      document.onkeydown = (e) => {
        let key = e.key;
        for (let _0xKey in KeyboardMap) {
          if (KeyboardMap[_0xKey] == key) {
            current0xKey = _0xKey;
            next(parseInt(current0xKey, 16));
            document.onkeydown = this.listen;
            isKeyDown = false;
            current0xKey = null;
          }
        }
      };
    })
  },


}

export default Keyboard;