const UNIT = 5;

let Display = {
  $container: null,
  $canvas: null,
  ctx: null,
  pixelArray: null,
  width: 64,
  height: 32,
  init(container) {
    this.$container = document.querySelector(container);
    this.$canvas = document.createElement("canvas");
    this.$canvas.width = this.width * UNIT;
    this.$canvas.height = this.height * UNIT;
    this.$canvas.id = "chip8";
    // this.$canvas.style = "border: 1px solid red";
    this.$container.appendChild(this.$canvas);
    this.ctx = this.$canvas.getContext("2d");
    this.ctx.fillStyle = "blue";
    this.pixelArray = new Array(this.width * this.height).fill(0);
  },
  update(array) {
    this.pixelArray = array;
  },
  getPixelArray() {
    return this.pixelArray
  },
  render() {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        if (this.pixelArray[i * 64 + j]) {
          this.ctx.fillRect(j * UNIT, i * UNIT, 1 * UNIT, 1 * UNIT);
        }
      }
    }
  },
  clear() {
    this.ctx.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
  }
}

export default Display;