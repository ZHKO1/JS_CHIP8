const KeyboardMap = {
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "A": "A",
  "B": "B",
  "C": "C",
  "D": "D",
  "E": "E",
  "F": "F",
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
  getCurrentStatus(){
    return [isKeyDown, paseInt(current0xKey, 16)]
  },
  waitKeyDown() {
    return new Promise((next) => {
      document.onkeydown = (e) => {
        let key = e.key;
        for (let _0xKey in KeyboardMap) {
          if (KeyboardMap[_0xKey] == key) {
            current0xKey = _0xKey;
            document.onkeydown = this.listen;
            isKeyDown = false;
            current0xKey = null;
            next(paseInt(current0xKey, 16));
          }
        }
      };
    })
  },


}

export default Keyboard;