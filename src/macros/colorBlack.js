const black = "#000000";

function main() {
  api.log.info("hello colornotes");

  applyToNotesInSelection(colorNote);
}

function applyToNotesInSelection(func) {
  var fullScore = !curScore.selection.elements.length;
  if (fullScore) {
    cmd("select-all");
  }
  curScore.startCmd();
  for (var i in curScore.selection.elements)
    if (curScore.selection.elements[i].pitch)
      func(curScore.selection.elements[i]);
  curScore.endCmd();
  if (fullScore) {
    cmd("escape");
  }
}

function colorNote(note) {
  note.color = black;

  if (note.accidental) {
    note.accidental.color = black;
  }

  if (note.dots) {
    for (var i = 0; i < note.dots.length; i++) {
      if (note.dots[i]) {
        note.dots[i].color = black;
      }
    }
  }
}
