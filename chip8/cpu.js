const TEST_FILE_ARRAY = [
  0x00, 0xe0, 0xa2, 0x2a, 0x60, 0x0c, 0x61, 0x08, 0xd0, 0x1f, 0x70, 0x09, 0xa2, 0x39, 0xd0, 0x1f,
  0xa2, 0x48, 0x70, 0x08, 0xd0, 0x1f, 0x70, 0x04, 0xa2, 0x57, 0xd0, 0x1f, 0x70, 0x08, 0xa2, 0x66,
  0xd0, 0x1f, 0x70, 0x08, 0xa2, 0x75, 0xd0, 0x1f, 0x12, 0x28, 0xff, 0x00, 0xff, 0x00, 0x3c, 0x00,
  0x3c, 0x00, 0x3c, 0x00, 0x3c, 0x00, 0xff, 0x00, 0xff, 0xff, 0x00, 0xff, 0x00, 0x38, 0x00, 0x3f,
  0x00, 0x3f, 0x00, 0x38, 0x00, 0xff, 0x00, 0xff, 0x80, 0x00, 0xe0, 0x00, 0xe0, 0x00, 0x80, 0x00,
  0x80, 0x00, 0xe0, 0x00, 0xe0, 0x00, 0x80, 0xf8, 0x00, 0xfc, 0x00, 0x3e, 0x00, 0x3f, 0x00, 0x3b,
  0x00, 0x39, 0x00, 0xf8, 0x00, 0xf8, 0x03, 0x00, 0x07, 0x00, 0x0f, 0x00, 0xbf, 0x00, 0xfb, 0x00,
  0xf3, 0x00, 0xe3, 0x00, 0x43, 0xe0, 0x00, 0xe0, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80,
  0x00, 0xe0, 0x00, 0xe0
];

const CLOCK_SPEED = 700;
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

// 记录
let PauseFlag = false;
let StepCycles = 0;

// 硬件
let Delay_Timer = 0;
let Sound_Timer = 0;

let Program_Counter = MEMORY_START;

let V_Array = new Array(16).fill(0);

let Register_I = 0;

let Stack = [];

let FileBufferArray = null;
let Display = null;
let Keyboard = null;

let CPU = {
  init(display, keyboard) {
    Display = display;
    Keyboard = keyboard;
  },
  read(array) {
    FileBufferArray = array;
  },
  async run() {
    PauseFlag = false;
    let running = true;
    while (running) {
      await this.next();
      running = await clock_frame();
    }
    function clock_frame() {
      return new Promise((next) => {
        if (PauseFlag) {
          next(false);
        } else {
          setTimeout(() => {
            next(true);
          }, 1000 / CLOCK_SPEED);
        }
      });
    }
  },
  stop() {
    PauseFlag = true;
  },
  async next() {
    await this.step(Program_Counter);
    Program_Counter = Program_Counter + 2;
    StepCycles += 1;
    // if( StepCycles * 1000 / CLOCK_SPEED >= 1000 / TIMER_SPEED) 
    if (StepCycles * TIMER_SPEED >= CLOCK_SPEED) {
      StepCycles = 0;
      if (Delay_Timer) {
        Delay_Timer -= 1
      }
      if (Sound_Timer) {
        Sound_Timer -= 1;
        !Sound_Timer && 1; // TODO 声音 
      };
    }
  },
  async step(memory_index) {
    if (memory_index > MEMORY_START + FileBufferArray.length - 1) {
      return false;
    }
    let result = this.decode(memory_index);
    if (result) {
      let { type, param } = result;
      console.log(`${to0X(memory_index)} tpye ${Instruction[type].msg}, ${JSON.stringify(param.map(x => to0X(x)))}`)
      await this.excute(type, param);
    } else {
      throw (new Error("读取不出指令"));
    }
    let index = memory_index - MEMORY_START;
    let code1 = FileBufferArray[index];
    let code2 = FileBufferArray[index + 1];
    console.log(`${to0X(memory_index)} raw ${to0X(code1)}${to0X(code2)}`)
  },
  decode(memory_index) {
    let index = memory_index - MEMORY_START;
    let code1 = FileBufferArray[index];
    let code2 = FileBufferArray[index + 1];
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
    await Instruction[type].done(...param);
  },
  getRegister(){
    return {
      V_Array,
      Register_I,
      Program_Counter
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
      Display.clear();
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
      let address = Stack.pop();
      Program_Counter = address;
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
      Program_Counter = NNN - 2;
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
      var address = Program_Counter;
      Stack.push(address);
      Program_Counter = NNN - 2;
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
      let Vx = V_Array[X];
      if (Vx === KK) {
        Program_Counter = Program_Counter + 2;
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
      let Vx = V_Array[X];
      if (Vx !== KK) {
        Program_Counter = Program_Counter + 2;
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
      let Vx = V_Array[X];
      let Vy = V_Array[Y];
      if (Vx === Vy) {
        Program_Counter = Program_Counter + 2;
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
      V_Array[X] = KK;
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
      V_Array[X] = (V_Array[X] + KK) & 0xFF;
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
      V_Array[X] = V_Array[Y];
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
      V_Array[X] = V_Array[X] | V_Array[Y];
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
      V_Array[X] = V_Array[X] & V_Array[Y];
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
      V_Array[X] = V_Array[X] ^ V_Array[Y];
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
      if (V_Array[X] + V_Array[Y] > 0xFF) {
        V_Array[0xF] = 1;
      } else {
        V_Array[0xF] = 0;
      }
      V_Array[X] = (V_Array[X] + V_Array[Y]) & 0xFF;
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
      if (V_Array[X] > V_Array[Y]) {
        V_Array[0xF] = 1;
      } else {
        V_Array[0xF] = 0;
      }
      V_Array[X] = (V_Array[X] - V_Array[Y]);
      V_Array[X] = V_Array[X] & 0xFF;
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
      V_Array[0xF] = (V_Array[X] & 0x01) ? 1 : 0;
      V_Array[X] = V_Array[X] >> 1;
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
      if (V_Array[X] < V_Array[Y]) {
        V_Array[0xF] = 1;
      } else {
        V_Array[0xF] = 0;
      }
      V_Array[X] = (V_Array[Y] - V_Array[X]) & 0xFF;
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
      V_Array[0xF] = V_Array[X] & 0x80 ? 1 : 0;
      V_Array[X] = (V_Array[X] << 1) & 0xFF;
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
      let Vx = V_Array[X];
      let Vy = V_Array[Y];
      if (Vx !== Vy) {
        Program_Counter = Program_Counter + 2;
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
      Register_I = NNN;
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
      Program_Counter = V_Array[0x0] + NNN - 2;
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
      V_Array[X] = random & KK;
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
      let Display_X = V_Array[X];
      let Display_Y = V_Array[Y];
      var slice = Util.getBytesSlice(Register_I, N);
      var array = Display.getPixelArray();
      for (var j = 0; j < N; j++) {
        for (var i = 0; i < 8; i++) {
          let from = slice[j] & Math.pow(2, 8 - i) ? 1 : 0;
          let to_x = (Display_X + i) % Display.width;
          let to_y = (Display_Y + j) % Display.height;
          let to_index = to_x + (to_y - 1) * Display.width;
          let to = array[to_index];
          if (((from ^ to) == 0) && from) {
            V_Array[0xF] = 1;
          } else {
            V_Array[0xF] = 0;
          }
          array[to_index] = (from ^ to);
        }
      }
      Display.render();
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
      let [isKeyDown, current0xKey] = Keyboard.getCurrentStatus();
      if (isKeyDown && current0xKey == V_Array[X]) {
        Program_Counter = Program_Counter + 2;
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
      let [isKeyDown, current0xKey] = Keyboard.getCurrentStatus();
      if (!isKeyDown || (isKeyDown && current0xKey == V_Array[X])) {
        Program_Counter = Program_Counter + 2;
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
      V_Array[X] = Delay_Timer
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
      let key = await Keyboard.waitKeyDown();
      V_Array[X] = key;
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
      Delay_Timer = V_Array[X]
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
      Sound_Timer = V_Array[X]
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
      Register_I = (Register_I + V_Array[X]) & 0xFFFF;
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
      let Vx = V_Array[X];
      Register_I = INNERDIGITS_START + Vx * 5;
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
      let Vx = V_Array[X];
      let index = Register_I - MEMORY_START;
      FileBufferArray[index] = Math.floor(Vx / 100) % 10;
      FileBufferArray[index + 1] = Math.floor(Vx / 10) % 10;
      FileBufferArray[index + 2] = Vx % 10;
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
      let index = Register_I - MEMORY_START;
      for (let i = 0; i <= X; i++) {
        let Vi = V_Array[i];
        FileBufferArray[index + i] = Vi;
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
      let index = Register_I - MEMORY_START;
      for (let i = 0; i <= X; i++) {
        V_Array[i] = FileBufferArray[index + i];
      }
    },
    msg: "LD Vx, [I]"
  },
};

let Util = {
  getBytesSlice(start, length, CPU) {
    let result = new Array(length).fill(0);
    if (start >= INNERDIGITS_START && start <= INNERDIGITS_MAX) {
      for (let i = 0; i < length; i++) {
        result[i] = INNERDIGITS[start - INNERDIGITS_START + i];
      }
    }
    if (start >= MEMORY_START) {
      for (let i = 0; i < length; i++) {
        result[i] = FileBufferArray[start - MEMORY_START + i];
      }
    }
    return result;
  }
}

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


export default CPU;