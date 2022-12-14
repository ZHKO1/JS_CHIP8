import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCREENSHOTS_GOLDEN = __dirname + "/SCREENSHOTS_GODHAND"
const SCREENSHOTS = __dirname + "/SCREENSHOTS"
const COMPAREDIFF = __dirname + "/COMPAREDIFF"
const ROMARRAY = ["bc_test.ch8", "c8_test.c8", "test_opcode.ch8"];

export {
  SCREENSHOTS_GOLDEN,
  SCREENSHOTS,
  COMPAREDIFF,
  ROMARRAY
};