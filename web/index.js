import Chip8 from './chip8.js'

let chip8 = Object.create(Chip8);
chip8.init({
  container: "#chip8_container",
});


let $selectButton = document.querySelector("#choose");
$selectButton.addEventListener("click", function () {
  chooseFile((buffer) => {
    chip8.read(buffer);
  });
});

let $runButton = document.querySelector("#RUN");
$runButton.addEventListener("click", function () {
  chip8.run();
});

let $stopButton = document.querySelector("#STOP");
$stopButton.addEventListener("click", function () {
  chip8.stop();
});

let $stepButton = document.querySelector("#STEP");
$stepButton.addEventListener("click", function () {
  chip8.step();
  updateStatus();
});


function chooseFile(callback) {
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
      callback && callback(buffer);
    }
  });
  $input.click();
}

function updateStatus(){
  let {
    V_Array,
    Register_I,
    Program_Counter
  } = chip8.getRegister();
  V_Array.forEach((val, index) => {
    let $span = document.querySelector("#V" + index);
    $span.innerHTML = val;
  })
  let $spanI = document.querySelector("#I");
  $spanI.innerHTML = Register_I;
  let $spanPC = document.querySelector("#PC");
  $spanPC.innerHTML = Program_Counter;
}
