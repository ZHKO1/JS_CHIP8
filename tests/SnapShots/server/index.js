import Chip8 from './chip8.js'

init();

async function init(){
  let chip8 = Object.create(Chip8);
  chip8.init({
    container: "#chip8_container",
  });
  
  let fileName = decodeURIComponent(getURLParameter('name'));
  if(fileName){
    const response = await fetch(`./roms/${fileName}`)
    const arrayBuffer = await response.arrayBuffer()
    const uint8View = new Uint8Array(arrayBuffer)
    chip8.read(uint8View);
    chip8.run();
  }
}

function getURLParameter(name, search){
	search = search != null ? search : window.location.search;
	var ret = (new RegExp("[\\?&#]" + name + "=([^&#]*)")).exec(search);
	return ret ? ret[1] : "";
}