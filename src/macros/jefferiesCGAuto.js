const { processScore } = require("../processScore");
const { ProcessMode } = require("../enums.js");
const { Instrument } = require("../instruments.js");

function main() {
  curScore.startCmd();

  processScore({
    mode: ProcessMode.AUTO,
    instrument: Instrument.JeffriesCG30,
  });

  curScore.endCmd();

  quit();
}
