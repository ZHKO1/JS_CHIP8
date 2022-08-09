import { expect } from 'chai';
import { Instruction } from '../src/cpu.js';
import CPU from '../src/cpu.js';
import Keyboard from '../src/keyboard.js';

let mockDisplay = {
  width: 64,
  height: 32,
  pixelArray: [],
  init(container) {
    this.pixelArray = new Array(this.width * this.height).fill(0);
  },
  update(array) {
    this.pixelArray = array;
  },
  getPixelArray() {
    return this.pixelArray
  },
  render() {
  },
  clearCtx() {
  },
  reset() {
    this.pixelArray = new Array(this.width * this.height).fill(0);
  }
}


describe('👀 SCREENSHOTS are correct', function () {
  before(async function () {
  });

  after((done) => {
    done()
  });

  beforeEach(async function () {
  });

  afterEach(() => {

  });

  describe('test rom', function () {
    let cpu;
    beforeEach(async function () {
      cpu = Object.create(CPU);
      let display = Object.create(mockDisplay);
      display.reset();
      let keyboard = Object.create(Keyboard);
      keyboard.init();
      cpu.init(display, keyboard);
    });

    async function execute(instruction) {
      let { type, param } = cpu.matchInstruction(instruction);
      await cpu.execute(type, param);
    }

    it('3: CLS (00e0) - Program should clear the display', async () => {
      let instruction = 0x00e0;
      await execute(instruction);
      expect(JSON.stringify(cpu.Display.pixelArray)).equal(JSON.stringify(new Array(cpu.Display.width * cpu.Display.height).fill(0)))
    })

    it('3: RET (00ee) - Program counter should be set to stack pointer, then decrement stack pointer', async () => {
      let instruction = 0x00ee;
      cpu.Stack[0x2] = 0xf;
      await execute(instruction);
      expect(cpu.Program_Counter).equal(0xf + 2);
      expect(cpu.Stack.length).equal(2);
    })


    it('4: JP_ADDR (1nnn) - Program counter should be set to address in argument', async () => {
      let instruction = 0x1333;
      await execute(instruction);
      expect(cpu.Program_Counter).equal(0x333);
    })


    it('5: CALL_ADDR (2nnn) - Stack pointer should increment, program counter should be set to address in argument', async () => {
      let instruction = 0x2062;
      let PC = cpu.Program_Counter;
      await execute(instruction);
      expect(cpu.Stack.length).equal(1)
      expect(cpu.Stack[cpu.Stack.length - 1]).equal(PC)
      expect(cpu.Program_Counter).equal(0x062);
    })

    it('6: SE_VX_NN (3xnn) - Program counter should increment by two bytes if register x is not equal to nn argument', async () => {
      let instruction = 0x3abb;
      await execute(instruction);
      expect(cpu.Program_Counter).equal(0x202);
    })

    it('6: SE_VX_NN (3xnn) - Program counter should increment by four bytes if register x is equal to nn argument', async () => {
      let instruction = 0x3abb;
      cpu.V_Array[0xa] = 0xbb;
      await execute(instruction);
      expect(cpu.Program_Counter).equal(0x204);
    })

    it('7: SNE_VX_NN (4xnn) - Program counter should increment by four bytes if register x is not equal to nn argument', async () => {
      let instruction = 0x4acc;
      await execute(instruction);
      expect(cpu.Program_Counter).equal(0x204);
    })

    it('7: SNE_VX_NN (4xnn) - Program counter should increment by two bytes if register x is equal to nn argument', async () => {
      let instruction = 0x4acc;
      cpu.V_Array[0xa] = 0xcc;
      await execute(instruction);
      expect(cpu.Program_Counter).equal(0x202);
    })

    it('8: SE_VX_VY (5xy0) - Program counter should increment by four if register x is equal to register y', async () => {
      let instruction = 0x5ab0;
      cpu.V_Array[0xa] = 0x5;
      cpu.V_Array[0xb] = 0x5;
      await execute(instruction);
      expect(cpu.Program_Counter).equal(0x204);
    })

    it('8: SE_VX_VY (5xy0) - Program counter should increment by two if register x is not equal to register y', async () => {
      let instruction = 0x5ab0;
      cpu.V_Array[0xa] = 0x5;
      cpu.V_Array[0xb] = 0x6;
      await execute(instruction);
      expect(cpu.Program_Counter).equal(0x202);
    })



    it('9: LD_VX_NN (6xnn) - Register x should be set to the value of argument nn', async () => {
      let instruction = 0x6abb;
      cpu.V_Array[0xa] = 0x10;
      await execute(instruction);
      expect(cpu.V_Array[0xa]).equal(0xbb);
    })

    it('10: ADD_VX_NN (7xnn) - Register x should be set to the value of register x plus argument nn', async () => {
      let instruction = 0x7abb;
      cpu.V_Array[0xa] = 0x10;
      await execute(instruction);
      expect(cpu.V_Array[0xa]).equal(0x10 + 0xbb);
    })

    it('11: LD_VX_VY (8xy0) - Register x should be set to the value of register y', async () => {
      let instruction = 0x8ab0;
      cpu.V_Array[0xb] = 0x8;
      await execute(instruction);
      expect(cpu.V_Array[0xa]).equal(0x8);
    })

    it('12: OR_VX_VY (8xy1) - Register x should be set to the value of register x OR register y', async () => {
      let instruction = 0x8ab1;
      cpu.V_Array[0xa] = 0x3;
      cpu.V_Array[0xb] = 0x4;
      await execute(instruction);
      expect(cpu.V_Array[0xa]).equal(0x7);
    })

    it('13: AND_VX_VY (8xy2) - Register x should be set to the value of register x AND register y', async () => {
      let instruction = 0x8ab2;
      cpu.V_Array[0xa] = 0x3;
      cpu.V_Array[0xb] = 0x4;
      await execute(instruction);
      expect(cpu.V_Array[0xa]).equal(0);
    })

    it('14: XOR_VX_VY (8xy3) - Register x should be set to the value of register x XOR register y', async () => {
      let instruction = 0x8ab3;
      cpu.V_Array[0xa] = 0x3;
      cpu.V_Array[0xb] = 0x3;
      await execute(instruction);

      expect(0x3 ^ 0x3).equal(0)
      expect(cpu.V_Array[0xa]).equal(0)
    })

    it('15: ADD_VX_VY (8xy4) - Register x should be set to the value of the sum of register x and register y (VF with no carry)', async () => {
      let instruction = 0x8ab4;
      cpu.V_Array[0xa] = 0x3;
      cpu.V_Array[0xb] = 0x4;
      await execute(instruction);

      expect(cpu.V_Array[0xa]).equal(0x7)
      expect(cpu.V_Array[0xf]).equal(0)
    })

    it('15: ADD_VX_VY (8xy4) - Register x should be set to the value of the sum of register x and register y (VF with carry)', async () => {
      let instruction = 0x8ab4;
      cpu.V_Array[0xa] = 0xff;
      cpu.V_Array[0xb] = 0xff;
      await execute(instruction);

      expect(cpu.V_Array[0xa]).equal(0xfe)
      expect(cpu.V_Array[0xf]).equal(1)
    })

    it('16: SUB_VX_VY (8xy5) - Register x should be set to the difference of register x and register y (VF with carry)', async () => {
      let instruction = 0x8ab5;
      cpu.V_Array[0xa] = 0x4;
      cpu.V_Array[0xb] = 0x2;
      await execute(instruction);

      expect(cpu.V_Array[0xa]).equal(2)
      expect(cpu.V_Array[0xf]).equal(1)
    })

    it('16: SUB_VX_VY (8xy5) - Register x should be set to the difference of register x and register y (VF with no carry)', async () => {
      let instruction = 0x8ab5;
      cpu.V_Array[0xa] = 0x2;
      cpu.V_Array[0xb] = 0x3;
      await execute(instruction);

      expect(cpu.V_Array[0xa]).equal(255)
      expect(cpu.V_Array[0xf]).equal(0)
    })

    it('17: SHR_VX_VY (8xy6) - Shift register x right 1 (AKA divide x by 2). Set VF to 1 if least significant bit of register x is 1', async () => {
      let instruction = 0x8ab6;
      cpu.V_Array[0xa] = 0x3;
      await execute(instruction);

      expect(cpu.V_Array[0xa]).equal(0x3 >> 1)
      expect(cpu.V_Array[0xf]).equal(1)
    })

    it('18: SUBN_VX_VY (8xy7) - Set register x to the difference of register y and register x (VF with no carry)', async () => {
      let instruction = 0x8ab7;
      cpu.V_Array[0xa] = 0x3;
      cpu.V_Array[0xb] = 0x2;
      await execute(instruction);

      expect(cpu.V_Array[0xa]).equal(255)
      expect(cpu.V_Array[0xf]).equal(0)
    })

    it('18: SUBN_VX_VY (8xy7) - Set register x to the difference of register y and register x (VF with carry)', async () => {
      let instruction = 0x8ab7;
      cpu.V_Array[0xa] = 0x2;
      cpu.V_Array[0xb] = 0x3;
      await execute(instruction);

      expect(cpu.V_Array[0xa]).equal(1)
      expect(cpu.V_Array[0xf]).equal(1)
    })

    it('19: SHL_VX_VY (8xyE) - Shift register x left one (AKA multiply by 2). Set VF to 1 if least significant bit of register x is 1', async () => {
      let instruction = 0x8abe;
      cpu.V_Array[0xa] = 0x3;
      await execute(instruction);

      expect(cpu.V_Array[0xa]).equal(0x3 << 1)
      expect(cpu.V_Array[0xf]).equal(0)
    })

    it('20: SNE_VX_VY (9xy0) - Program counter should increment by four bytes if register x is not equal to register y', async () => {
      let instruction = 0x9ab0;
      cpu.V_Array[0xa] = 0x3;
      cpu.V_Array[0xb] = 0x4;
      await execute(instruction);

      expect(cpu.Program_Counter).equal(0x204)
    })

    it('20: SNE_VX_VY (9xy0) - Program counter should increment by two bytes if register x is equal to register y', async () => {
      let instruction = 0x9ab0;
      cpu.V_Array[0xa] = 0x3;
      cpu.V_Array[0xb] = 0x3;
      await execute(instruction);

      expect(cpu.Program_Counter).equal(0x202)
    })

    it('21: LD_I_ADDR (Annn) - I should be set to the value of argument nnn', async () => {
      let instruction = 0xa999;
      await execute(instruction);

      expect(cpu.Register_I).equal(0x999)
    })

    it('22: JP_V0_ADDR (Bnnn) - Program counter should be set to the sum of V0 and argument nnn', async () => {
      let instruction = 0xb300;
      cpu.V_Array[0] = 0x2;
      await execute(instruction);

      expect(cpu.Program_Counter).equal(0x2 + 0x300)
    })


    it('24: DRW_VX_VY_N (Dxyn) - n byte sprite should be disiplayed at coordinates in register x, register y', async () => {
      let instruction = 0xd125;
      cpu.V_Array[0x1] = 1;
      cpu.V_Array[0x2] = 1;
      await execute(instruction);
      expect(cpu.Display.pixelArray[1 + 1 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[1 + 2 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[1 + 3 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[1 + 4 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[1 + 2 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[2 + 2 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[3 + 2 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[4 + 2 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[1 + 3 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[2 + 3 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[3 + 3 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[4 + 3 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[1 + 4 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[2 + 4 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[3 + 4 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[4 + 4 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[1 + 5 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[1 + 5 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[1 + 5 * cpu.Display.width]).equal(1)
      expect(cpu.Display.pixelArray[1 + 5 * cpu.Display.width]).equal(1)

      // No pixels were erased (no collision)
      expect(cpu.V_Array[0xf]).equal(0)

      // This it relies on the previous one, to erase the previous values with collisions
      instruction = 0xd125;
      cpu.V_Array[0x1] = 1;
      cpu.V_Array[0x2] = 1;
      await execute(instruction);
      expect(cpu.Display.pixelArray[1 + 1 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[1 + 2 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[1 + 3 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[1 + 4 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[1 + 2 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[4 + 2 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[1 + 3 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[4 + 3 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[1 + 4 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[4 + 4 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[1 + 5 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[1 + 5 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[1 + 5 * cpu.Display.width]).equal(0)
      expect(cpu.Display.pixelArray[1 + 5 * cpu.Display.width]).equal(0)

      // All pixels were erased (collision)
      expect(cpu.V_Array[0xf]).equal(1)
    })

    it('25: SKP_VX (Ex9E) - Program counter should increment by four bytes if key with value of register x is selected', async () => {
      let instruction = 0xea9e;
      cpu.V_Array[0xa] = 4;
      cpu.Keyboard.keyDown(4);
      await execute(instruction);
      expect(cpu.Program_Counter).equal(0x204)
    })

    it('25: SKP_VX (Ex9E) - Program counter should increment by two bytes if key with value of register x is not selected', async () => {
      let instruction = 0xea9e;
      cpu.V_Array[0xa] = 1;
      cpu.Keyboard.keyUp(1);
      await execute(instruction);

      expect(cpu.Program_Counter).equal(0x202)
    })

    it('26: SKNP_VX (ExA1) - Program counter should increment by two bytes if value of register x is a selected key', async () => {
      let instruction = 0xeba1;
      cpu.V_Array[0xb] = 4;
      cpu.Keyboard.keyDown(4);
      await execute(instruction);
      expect(cpu.Program_Counter).equal(0x202)
    })

    it('26: SKNP_VX (ExA1) - Program counter should increment by four bytes if value of register x is not a selected key', async () => {
      let instruction = 0xeba1;
      cpu.V_Array[0xa] = 1;
      cpu.Keyboard.keyUp(1);
      await execute(instruction);
      expect(cpu.Program_Counter).equal(0x204)
    })

    it('27: LD_VX_DT (Fx07) - Register x should be set to the value of DT (delay timer)', async () => {
      let instruction = 0xfa07;
      cpu.Delay_Timer = 0xf;
      await execute(instruction);

      expect(cpu.V_Array[0xa]).equal(0xf)
    })

    it('28: LD_VX_N (Fx0A) - Register x should be set to the value of keypress', async () => {
      let instruction = 0xfb0a;
      await execute(instruction);
      expect(cpu.V_Array[0xb]).equal(0);
      cpu.Keyboard.keyDown(5);
      await execute(instruction);
      expect(cpu.V_Array[0xb]).equal(5)
    })

    it('29: LD_DT_VX (Fx15) - Delay timer should be set to the value of register x', async () => {
      // todo tick
      let instruction = 0xfb15;
      cpu.V_Array[0xb] = 0xf;
      await execute(instruction);

      expect(cpu.Delay_Timer).equal(0xf)
    })

    it('30: LD_ST_VX (Fx18) - Sound timer should be set to the value of register x', async () => {
      // todo tick
      let instruction = 0xfa18;
      cpu.V_Array[0xa] = 0xf;
      await execute(instruction);

      expect(cpu.Sound_Timer).equal(0xf)
    })

    it('31: ADD_I_VX (Fx1E) - I should be set to the value of the sum of I and register x', async () => {
      let instruction = 0xfa1e;
      cpu.Register_I = 0xe
      cpu.V_Array[0xa] = 0xf;
      await execute(instruction);

      expect(cpu.Register_I).equal(0xe + 0xf)
    })

    it('32: LD_F_VX (Fx29) - I should be set to the location of the sprite for digit in register x', async () => {
      let instruction = 0xfa29;
      cpu.V_Array[0xa] = 0xa;
      await execute(instruction);

      expect(cpu.Register_I).equal(0xa * 5)
    })

    it('33: LD_B_VX (Fx33) - BCD representation of register x should be loaded into memory I, I+1, I+2 ', async () => {
      let instruction = 0xfa33;
      cpu.V_Array[0xa] = 0x7b;
      cpu.Register_I = 0x300;
      await execute(instruction);

      expect(cpu.FileBufferArray[0x300 - 0x200]).equal(1)
      expect(cpu.FileBufferArray[0x301 - 0x200]).equal(2)
      expect(cpu.FileBufferArray[0x302 - 0x200]).equal(3)
    })

    it('34: LD_I_VX (Fx55) - Memory should be set to register 0 through register x starting at location I', async () => {
      let instruction = 0xfb55;
      cpu.Register_I = 0x400

      for (let i = 0; i <= 0xb; i++) {
        cpu.V_Array[i] = i;
      }
      await execute(instruction);

      for (let i = 0; i <= 0xb; i++) {
        expect(cpu.FileBufferArray[cpu.Register_I + i - 0x200]).equal(i)
      }

      expect(cpu.FileBufferArray[cpu.Register_I + 0xc - 0x200]).equal(0)
    })

    it('35: LD_VX_I (Fx65) - Registers 0 through x should be set to the value of memory starting at location I', async () => {
      let instruction = 0xfa65;
      cpu.Register_I = 0x400

      for (let i = 0; i <= 0xa; i++) {
        cpu.FileBufferArray[cpu.Register_I + i - 0x200] = i
      }
      await execute(instruction);

      for (let i = 0; i <= 0xa; i++) {
        expect(cpu.V_Array[i]).equal(i)
      }
      expect(cpu.V_Array[0xb]).equal(0)
    })

  });


});
