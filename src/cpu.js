// 在1/TIMER_SPEED秒内 执行的多个指令，一定程度上页面更加流畅
const CLOCK_NUMBER = 10;
const TIMER_SPEED = 60;

const INNERDIGITS_START = 0x000;
const INNERDIGITS_MAX = 0x1FF;
const INNERDIGITS = [
  0xF0, 0x90, 0x90, 0x90, 0xF0,
  0x20, 0x60, 0x20, 0x20, 0x70,
  0xF0, 0x10, 0xF0, 0x80, 0xF0,
  0xF0, 0x10, 0xF0, 0x10, 0xF0,
  0x90, 0x90, 0xF0, 0x10, 0x10,
  0xF0, 0x80, 0xF0, 0x10, 0xF0,
  0xF0, 0x80, 0xF0, 0x90, 0xF0,
  0xF0, 0x10, 0x20, 0x40, 0x40,
  0xF0, 0x90, 0xF0, 0x90, 0xF0,
  0xF0, 0x90, 0xF0, 0x10, 0xF0,
  0xF0, 0x90, 0xF0, 0x90, 0x90,
  0xE0, 0x90, 0xE0, 0x90, 0xE0,
  0xF0, 0x80, 0x80, 0x80, 0xF0,
  0xE0, 0x90, 0x90, 0x90, 0xE0,
  0xF0, 0x80, 0xF0, 0x80, 0xF0,
  0xF0, 0x80, 0xF0, 0x80, 0x80,
];

const MEMORY_START = 0x200;
const MEMORY_END = 0xE9F;

let CPU = {
  PauseFlag: false,
  StepCycles: 0,
  // 硬件
  Delay_Timer: 0,
  Sound_Timer: 0,
  Stack: [],
  Program_Counter: MEMORY_START,
  Register_I: 0,
  V_Array: new Array(16).fill(0),
  FileBufferArray: null,
  Display: null,
  Keyboard: null,
  init(display, keyboard) {
    this.Display = display;
    this.Keyboard = keyboard;
    this.reset();
  },
  read(array) {
    this.FileBufferArray = array;
  },
  async run() {
    let self = this;
    this.PauseFlag = false;
    let running = true;
    while (running) {
      for (let i = 0; i < CLOCK_NUMBER; i++) {
        await this.next();
      }
      this.Display.clearCtx();
      this.Display.render();
      running = await clock_frame();

    }
    function clock_frame() {
      return new Promise((next) => {
        if (self.PauseFlag) {
          next(false);
        } else {
          setTimeout(() => {
            next(true);
          }, 1000 / TIMER_SPEED);
        }
      });
    }
  },
  stop() {
    this.PauseFlag = true;
  },
  reset() {
    this.Delay_Timer = 0;
    this.Sound_Timer = 0;
    this.Stack = [];
    this.Program_Counter = MEMORY_START;
    this.Register_I = 0;
    this.V_Array = new Array(16).fill(0);
    this.FileBufferArray = new Array(MEMORY_END - MEMORY_START + 1).fill(0);
  },
  async manual_next() {
    await this.next();
    this.Display.clearCtx();
    this.Display.render();
  },
  async next() {
    await this.step();
    this.StepCycles += 1;
    if (this.StepCycles == CLOCK_NUMBER) {
      this.StepCycles = 0;
      if (this.Delay_Timer) {
        this.Delay_Timer -= 1
      }
      if (this.Sound_Timer) {
        this.Sound_Timer -= 1;
        !this.Sound_Timer && 1; // TODO 声音 
      };
    }
  },
  async step() {
    let memory_index = this.Program_Counter;
    if (memory_index > MEMORY_START + this.FileBufferArray.length - 1) {
      return false;
    }
    let result = this.decode(memory_index);
    if (result) {
      let { type, param } = result;
      // console.log(`${to0X(memory_index)} tpye ${Instruction[type].msg}, ${JSON.stringify(param.map(x => to0X(x)))}`)
      await this.excute(type, param);
    } else {
      throw (new Error("读取不出指令"));
    }
    let index = memory_index - MEMORY_START;
    let code1 = this.FileBufferArray[index];
    let code2 = this.FileBufferArray[index + 1];
    // console.log(`${to0X(memory_index)} raw ${to0X(code1)}${to0X(code2)}`)
  },
  decode(memory_index) {
    let index = memory_index - MEMORY_START;
    let code1 = this.FileBufferArray[index];
    let code2 = this.FileBufferArray[index + 1];
    let code1code2 = (code1 << 8) + code2;
    return this.matchInstruction(code1code2);
  },
  matchInstruction(code) {
    var keys = Object.keys(Instruction);
    let result = null;
    for (let key of keys) {
      let param = Instruction[key].is(code);
      let type = key;
      if (param) {
        result = {
          type,
          param
        }
        break;
      }
    }
    return result;
  },
  async excute(type, param) {
    await Instruction[type].done.apply(this, param);
    this.Program_Counter += 2;
  },
  getRegister() {
    return {
      V_Array: this.V_Array,
      Register_I: this.Register_I,
      Program_Counter: this.Program_Counter
    }
  }
}

let Instruction = {
  "00E0": {
    is(code) {
      if (code === 0x00E0) {
        return [];
      } else {
        return false;
      }
    },
    done() {
      this.Display.clearCtx();
    },
    msg: "CLS"
  },
  "00EE": {
    is(code) {
      if (code === 0x00EE) {
        return [];
      } else {
        return false;
      }
    },
    done() {
      let address = this.Stack.pop();
      this.Program_Counter = address;
    },
    msg: "RET"
  },
  "1NNN": {
    is(code) {
      if (eq(code, 1, 1)) {
        let NNN = InstructionParam["NNN"].get(code);
        return [NNN];
      } else {
        return false;
      }
    },
    done(NNN) {
      this.Program_Counter = NNN - 2;
    },
    msg: "JP addr"
  },
  "2NNN": {
    is(code) {
      if (eq(code, 1, 2)) {
        let NNN = InstructionParam["NNN"].get(code);
        return [NNN];
      } else {
        return false;
      }
    },
    done(NNN) {
      var address = this.Program_Counter;
      this.Stack.push(address);
      this.Program_Counter = NNN - 2;
    },
    msg: "CALL addr"
  },
  "3XKK": {
    is(code) {
      if (eq(code, 1, 3)) {
        let X = InstructionParam["X"].get(code);
        let KK = InstructionParam["KK"].get(code);
        return [X, KK];
      } else {
        return false;
      }
    },
    done(X, KK) {
      let Vx = this.V_Array[X];
      if (Vx === KK) {
        this.Program_Counter += 2;
      }
    },
    msg: "SE Vx, byte"
  },
  "4XKK": {
    is(code) {
      if (eq(code, 1, 4)) {
        let X = InstructionParam["X"].get(code);
        let KK = InstructionParam["KK"].get(code);
        return [X, KK];
      } else {
        return false;
      }
    },
    done(X, KK) {
      let Vx = this.V_Array[X];
      if (Vx !== KK) {
        this.Program_Counter += 2;
      }
    },
    msg: "SNE Vx, byte"
  },
  "5XY0": {
    is(code) {
      if (eq(code, 1, 5) && eq(code, 4, 0)) {
        let X = InstructionParam["X"].get(code);
        let Y = InstructionParam["Y"].get(code);
        return [X, Y];
      } else {
        return false;
      }
    },
    done(X, Y) {
      let Vx = this.V_Array[X];
      let Vy = this.V_Array[Y];
      if (Vx === Vy) {
        this.Program_Counter += 2;
      }
    },
    msg: "SE Vx, Vy"
  },
  "6XKK": {
    is(code) {
      if (eq(code, 1, 6)) {
        let X = InstructionParam["X"].get(code);
        let KK = InstructionParam["KK"].get(code);
        return [X, KK];
      } else {
        return false;
      }
    },
    done(X, KK) {
      this.V_Array[X] = KK;
    },
    msg: "LD Vx, byte"
  },
  "7XKK": {
    is(code) {
      if (eq(code, 1, 7)) {
        let X = InstructionParam["X"].get(code);
        let KK = InstructionParam["KK"].get(code);
        return [X, KK];
      } else {
        return false;
      }
    },
    done(X, KK) {
      this.V_Array[X] = (this.V_Array[X] + KK) & 0xFF;
    },
    msg: "ADD Vx, byte"
  },
  "8XY0": {
    is(code) {
      if (eq(code, 1, 8) && eq(code, 4, 0)) {
        let X = InstructionParam["X"].get(code);
        let Y = InstructionParam["Y"].get(code);
        return [X, Y];
      } else {
        return false;
      }
    },
    done(X, Y) {
      this.V_Array[X] = this.V_Array[Y];
    },
    msg: "LD Vx, Vy"
  },
  "8XY1": {
    is(code) {
      if (eq(code, 1, 8) && eq(code, 4, 1)) {
        let X = InstructionParam["X"].get(code);
        let Y = InstructionParam["Y"].get(code);
        return [X, Y];
      } else {
        return false;
      }
    },
    done(X, Y) {
      this.V_Array[X] = this.V_Array[X] | this.V_Array[Y];
    },
    msg: "OR Vx, Vy"
  },
  "8XY2": {
    is(code) {
      if (eq(code, 1, 8) && eq(code, 4, 2)) {
        let X = InstructionParam["X"].get(code);
        let Y = InstructionParam["Y"].get(code);
        return [X, Y];
      } else {
        return false;
      }
    },
    done(X, Y) {
      this.V_Array[X] = this.V_Array[X] & this.V_Array[Y];
    },
    msg: "AND Vx, Vy"
  },
  "8XY3": {
    is(code) {
      if (eq(code, 1, 8) && eq(code, 4, 3)) {
        let X = InstructionParam["X"].get(code);
        let Y = InstructionParam["Y"].get(code);
        return [X, Y];
      } else {
        return false;
      }
    },
    done(X, Y) {
      this.V_Array[X] = this.V_Array[X] ^ this.V_Array[Y];
    },
    msg: "XOR Vx, Vy"
  },
  "8XY4": {
    is(code) {
      if (eq(code, 1, 8) && eq(code, 4, 4)) {
        let X = InstructionParam["X"].get(code);
        let Y = InstructionParam["Y"].get(code);
        return [X, Y];
      } else {
        return false;
      }
    },
    done(X, Y) {
      if (this.V_Array[X] + this.V_Array[Y] > 0xFF) {
        this.V_Array[0xF] = 1;
      } else {
        this.V_Array[0xF] = 0;
      }
      this.V_Array[X] = (this.V_Array[X] + this.V_Array[Y]) & 0xFF;
    },
    msg: "ADD Vx, Vy"
  },
  "8XY5": {
    is(code) {
      if (eq(code, 1, 8) && eq(code, 4, 5)) {
        let X = InstructionParam["X"].get(code);
        let Y = InstructionParam["Y"].get(code);
        return [X, Y];
      } else {
        return false;
      }
    },
    done(X, Y) {
      if (this.V_Array[X] > this.V_Array[Y]) {
        this.V_Array[0xF] = 1;
      } else {
        this.V_Array[0xF] = 0;
      }
      this.V_Array[X] = (this.V_Array[X] - this.V_Array[Y]);
      this.V_Array[X] = this.V_Array[X] & 0xFF;
    },
    msg: "SUB Vx, Vy"
  },
  "8XY6": {
    is(code) {
      if (eq(code, 1, 8) && eq(code, 4, 6)) {
        let X = InstructionParam["X"].get(code);
        let Y = InstructionParam["Y"].get(code);
        return [X, Y];
      } else {
        return false;
      }
    },
    done(X, Y) {
      this.V_Array[0xF] = (this.V_Array[X] & 0x01) ? 1 : 0;
      this.V_Array[X] = this.V_Array[X] >> 1;
    },
    msg: "SHR Vx {, Vy}"
  },
  "8XY7": {
    is(code) {
      if (eq(code, 1, 8) && eq(code, 4, 7)) {
        let X = InstructionParam["X"].get(code);
        let Y = InstructionParam["Y"].get(code);
        return [X, Y];
      } else {
        return false;
      }
    },
    done(X, Y) {
      if (this.V_Array[X] < this.V_Array[Y]) {
        this.V_Array[0xF] = 1;
      } else {
        this.V_Array[0xF] = 0;
      }
      this.V_Array[X] = (this.V_Array[Y] - this.V_Array[X]) & 0xFF;
    },
    msg: "SUBN Vx, Vy"
  },
  "8XYE": {
    is(code) {
      if (eq(code, 1, 8) && eq(code, 4, 0xe)) {
        let X = InstructionParam["X"].get(code);
        let Y = InstructionParam["Y"].get(code);
        return [X, Y];
      } else {
        return false;
      }
    },
    done(X, Y) {
      this.V_Array[0xF] = this.V_Array[X] & 0x80 ? 1 : 0;
      this.V_Array[X] = (this.V_Array[X] << 1) & 0xFF;
    },
    msg: "SHL Vx {, Vy}"
  },
  "9XY0": {
    is(code) {
      if (eq(code, 1, 9) && eq(code, 4, 0)) {
        let X = InstructionParam["X"].get(code);
        let Y = InstructionParam["Y"].get(code);
        return [X, Y];
      } else {
        return false;
      }
    },
    done(X, Y) {
      let Vx = this.V_Array[X];
      let Vy = this.V_Array[Y];
      if (Vx !== Vy) {
        this.Program_Counter += 2;
      }
    },
    msg: "SNE Vx, Vy"
  },
  "ANNN": {
    is(code) {
      if (eq(code, 1, 0xA)) {
        let NNN = InstructionParam["NNN"].get(code);
        return [NNN];
      } else {
        return false;
      }
    },
    done(NNN) {
      this.Register_I = NNN;
    },
    msg: "LD I, addr"
  },
  "BNNN": {
    is(code) {
      if (eq(code, 1, 0xB)) {
        let NNN = InstructionParam["NNN"].get(code);
        return [NNN];
      } else {
        return false;
      }
    },
    done(NNN) {
      this.Program_Counter = this.V_Array[0x0] + NNN - 2;
    },
    msg: "JP V0, addr"
  },
  "CXKK": {
    is(code) {
      if (eq(code, 1, 0xC)) {
        let X = InstructionParam["X"].get(code);
        let KK = InstructionParam["KK"].get(code);
        return [X, KK];
      } else {
        return false;
      }
    },
    done(X, KK) {
      let random = Math.floor(Math.random() * 255);
      this.V_Array[X] = random & KK;
    },
    msg: "RND Vx, byte"
  },
  "DXYN": {
    is(code) {
      if (eq(code, 1, 0xD)) {
        let X = InstructionParam["X"].get(code);
        let Y = InstructionParam["Y"].get(code);
        let N = InstructionParam["N"].get(code);
        return [X, Y, N];
      } else {
        return false;
      }
    },
    done(X, Y, N) {
      let Display = this.Display;
      let Display_X = this.V_Array[X];
      let Display_Y = this.V_Array[Y];
      var getBytesSlice = (start, length) => {
        let result = new Array(length).fill(0);
        if (start >= INNERDIGITS_START && start <= INNERDIGITS_MAX) {
          for (let i = 0; i < length; i++) {
            result[i] = INNERDIGITS[start - INNERDIGITS_START + i];
          }
        }
        if (start >= MEMORY_START) {
          for (let i = 0; i < length; i++) {
            result[i] = this.FileBufferArray[start - MEMORY_START + i];
          }
        }
        return result;
      }
      var slice = getBytesSlice(this.Register_I, N);
      var array = Display.getPixelArray();
      let conflict = false;
      for (var j = 0; j < N; j++) {
        for (var i = 0; i < 8; i++) {
          let newPixel = (slice[j] & Math.pow(2, 8 - i - 1)) ? 1 : 0;
          let x = (Display_X + i) % Display.width;
          let y = (Display_Y + j) % Display.height;
          let index = x + y * Display.width;
          let origin = array[index];
          if (((origin ^ newPixel) == 0) && origin) {
            conflict = true;
          }
          array[index] = (origin ^ newPixel);
        }
      }
      if (conflict) {
        this.V_Array[0xF] = 1;
      } else {
        this.V_Array[0xF] = 0;
      }
    },
    msg: "DRW Vx, Vy, N"
  },
  "EX9E": {
    is(code) {
      if (eq(code, 1, 0xE) && eq(code, 3, 0x9) && eq(code, 4, 0xE)) {
        let X = InstructionParam["X"].get(code);
        return [X];
      } else {
        return false;
      }
    },
    done(X) {
      let Keyboard = this.Keyboard;
      let [isKeyDown, currentKey_0x] = Keyboard.getCurrentStatus();
      if (isKeyDown && (currentKey_0x == this.V_Array[X])) {
        this.Program_Counter += 2;
      }
    },
    msg: "SKP Vx"
  },
  "EXA1": {
    is(code) {
      if (eq(code, 1, 0xE) && eq(code, 3, 0xA) && eq(code, 4, 0x1)) {
        let X = InstructionParam["X"].get(code);
        return [X];
      } else {
        return false;
      }
    },
    done(X) {
      let Keyboard = this.Keyboard;
      let [isKeyDown, currentKey_0x] = Keyboard.getCurrentStatus();
      if (!isKeyDown || (isKeyDown && (currentKey_0x !== this.V_Array[X]))) {
        this.Program_Counter += 2;
      }
    },
    msg: "SKNP Vx"
  },
  "FX07": {
    is(code) {
      if (eq(code, 1, 0xF) && eq(code, 3, 0x0) && eq(code, 4, 0x7)) {
        let X = InstructionParam["X"].get(code);
        return [X];
      } else {
        return false;
      }
    },
    done(X) {
      this.V_Array[X] = this.Delay_Timer
    },
    msg: "LD Vx, DT"
  },
  "FX0A": {
    is(code) {
      if (eq(code, 1, 0xF) && eq(code, 3, 0x0) && eq(code, 4, 0xA)) {
        let X = InstructionParam["X"].get(code);
        return [X];
      } else {
        return false;
      }
    },
    async done(X) {
      // 避免一次性执行多个指令，突然碰到其中一个强制中断，导致此时没有绘图的情况
      this.Display.clearCtx();
      this.Display.render();
      let key = await this.Keyboard.waitKeyDown();
      this.V_Array[X] = key;
    },
    msg: "LD Vx, K"
  },
  "FX15": {
    is(code) {
      if (eq(code, 1, 0xF) && eq(code, 3, 0x1) && eq(code, 4, 0x5)) {
        let X = InstructionParam["X"].get(code);
        return [X];
      } else {
        return false;
      }
    },
    done(X) {
      this.Delay_Timer = this.V_Array[X]
    },
    msg: "LD DT, Vx"
  },
  "FX18": {
    is(code) {
      if (eq(code, 1, 0xF) && eq(code, 3, 0x1) && eq(code, 4, 0x8)) {
        let X = InstructionParam["X"].get(code);
        return [X];
      } else {
        return false;
      }
    },
    done(X) {
      this.Sound_Timer = this.V_Array[X]
    },
    msg: "LD ST, Vx"
  },
  "FX1E": {
    is(code) {
      if (eq(code, 1, 0xF) && eq(code, 3, 0x1) && eq(code, 4, 0xE)) {
        let X = InstructionParam["X"].get(code);
        return [X];
      } else {
        return false;
      }
    },
    done(X) {
      this.Register_I = (this.Register_I + this.V_Array[X]) & 0xFFFF;
    },
    msg: "ADD I, Vx"
  },
  "FX29": {
    is(code) {
      if (eq(code, 1, 0xF) && eq(code, 3, 0x2) && eq(code, 4, 0x9)) {
        let X = InstructionParam["X"].get(code);
        return [X];
      } else {
        return false;
      }
    },
    done(X) {
      let Vx = this.V_Array[X];
      this.Register_I = INNERDIGITS_START + Vx * 5;
    },
    msg: "LD F, Vx"
  },
  "FX33": {
    is(code) {
      if (eq(code, 1, 0xF) && eq(code, 3, 0x3) && eq(code, 4, 0x3)) {
        let X = InstructionParam["X"].get(code);
        return [X];
      } else {
        return false;
      }
    },
    done(X) {
      let Vx = this.V_Array[X];
      let index = this.Register_I - MEMORY_START;
      this.FileBufferArray[index] = Math.floor(Vx / 100) % 10;
      this.FileBufferArray[index + 1] = Math.floor(Vx / 10) % 10;
      this.FileBufferArray[index + 2] = Vx % 10;
    },
    msg: "LD B, Vx"
  },
  "FX55": {
    is(code) {
      if (eq(code, 1, 0xF) && eq(code, 3, 0x5) && eq(code, 4, 0x5)) {
        let X = InstructionParam["X"].get(code);
        return [X];
      } else {
        return false;
      }
    },
    done(X) {
      let index = this.Register_I - MEMORY_START;
      for (let i = 0; i <= X; i++) {
        let Vi = this.V_Array[i];
        this.FileBufferArray[index + i] = Vi;
      }
    },
    msg: "LD [I], Vx"
  },
  "FX65": {
    is(code) {
      if (eq(code, 1, 0xF) && eq(code, 3, 0x6) && eq(code, 4, 0x5)) {
        let X = InstructionParam["X"].get(code);
        return [X];
      } else {
        return false;
      }
    },
    done(X) {
      let index = this.Register_I - MEMORY_START;
      for (let i = 0; i <= X; i++) {
        this.V_Array[i] = this.FileBufferArray[index + i];
      }
    },
    msg: "LD Vx, [I]"
  },
};


let InstructionParam = {
  "NNN": {
    get(code) {
      let NNN = code & 0x0FFF;
      return NNN;
    }
  },
  "N": {
    get(code) {
      let N = code & 0x000F;
      return N
    }
  },
  "X": {
    get(code) {
      let X = (code & 0x0F00) >> 8;
      return X
    }
  },
  "Y": {
    get(code) {
      let Y = (code & 0x00F0) >> 4;
      return Y
    }
  },
  "KK": {
    get(code) {
      let KK = code & 0x00FF;
      return KK
    }
  },
};

function to0X(num) {
  let pre = "";
  if (num < 16) {
    pre = "0"
  }
  return pre + num.toString(16)
}

function eq(code, index, value) {
  if (index == 4) {
    return (code & 0xF) == value
  }
  if (index == 3) {
    return ((code & 0xF0) >> 4) == value
  }
  if (index == 2) {
    return ((code & 0xF00) >> 8) == value
  }
  if (index == 1) {
    return ((code & 0xF000) >> 12) == value
  }
}

export {
  Instruction
};
export default CPU;