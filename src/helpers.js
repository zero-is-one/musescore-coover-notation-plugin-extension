const Note = require("./tonal-note-es5.js");
const { Hand } = require("./enums.js");

function getButtonsByNoteNamesAndAction(layout, noteNames, action) {
  const buttons = layout.filter((button) =>
    isNoteNameEqual(button[action], noteNames)
  );
  const leftHandButtons = buttons.filter((b) => b.hand === Hand.LEFT);
  const rightHandButtons = buttons.filter((b) => b.hand === Hand.RIGHT);

  return {
    buttons,
    leftHandButtons,
    rightHandButtons,
  };
}

// convert musescore Tonal Pitch Class enum to note name
// https://musescore.org/en/handbook/developers-handbook/plugin-development/tonal-pitch-class-enum
function tonalPitchClassToNoteLetter(tpc) {
  let name;

  // prettier-ignore
  switch (tpc) {
      case -1: name = "Fb"; break;
      case 0: name = "Cb"; break;
      case 1: name = "Gb"; break;
      case 2: name = "Db"; break;
      case 3: name = "Ab"; break;
      case 4: name = "Eb"; break;
      case 5: name = "Bb"; break;
      case 6: name = "Fb"; break;
      case 7: name = "Cb"; break;
  
      case 8: name = "Gb"; break;
      case 9: name = "Db"; break;
      case 10: name = "Ab"; break;
      case 11: name = "Eb"; break;
      case 12: name = "Bb"; break;
      case 13: name = "F"; break;
      case 14: name = "C"; break;
      case 15: name = "G"; break;
      case 16: name = "D"; break;
      case 17: name = "A"; break;
      case 18: name = "E"; break;
      case 19: name = "B"; break;
  
      case 20: name = "F#"; break;
      case 21: name = "C#"; break;
      case 22: name = "G#"; break;
      case 23: name = "D#"; break;
      case 24: name = "A#"; break;
      case 25: name = "E#"; break;
      case 26: name = "B#"; break;
      case 27: name = "F##"; break;
      case 28: name = "C##"; break;
      case 29: name = "G##"; break;
      case 30: name = "D##"; break;
      case 31: name = "A##"; break;
      case 32: name = "E##"; break;
      case 33: name = "B##"; break;
      default: name = undefined; break;
    }

  return name;
}

function noteElementToNoteName(noteElement) {
  const oct = Math.floor(noteElement.pitch / 12) - 1;
  const name = tonalPitchClassToNoteLetter(noteElement.tpc);
  return name + oct;
}

function colorNote(note, color) {
  note.color = color;

  if (note.accidental) {
    note.accidental.color = color;
  }

  if (note.dots) {
    for (var i = 0; i < note.dots.length; i++) {
      if (note.dots[i]) {
        note.dots[i].color = color;
      }
    }
  }
}

function isNoteNameEqual(noteName1, noteNameOrArr) {
  const midi1 = Note.props(noteName1).midi;
  const midi2 = Array.isArray(noteNameOrArr)
    ? noteNameOrArr.map((name) => Note.props(name).midi)
    : [Note.props(noteNameOrArr).midi];

  return midi2.includes(midi1);
}

module.exports = {
  getButtonsByNoteNamesAndAction,
  tonalPitchClassToNoteLetter,
  colorNote,
  isNoteNameEqual,
  noteElementToNoteName,
};
