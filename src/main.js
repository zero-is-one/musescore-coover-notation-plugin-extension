const {
  noteElementToNoteName,
  isNoteNameEqual,
  colorNote,
} = require("./helpers.js");
const { Colors } = require("./colors.js");
const layout = require("./layouts.js")["cg-wheatstone-30"].layout;
const { Hand, Action } = require("./enums.js");

function getButtonsByNoteNamesAndAction(noteNames, action) {
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

function main() {
  api.log.info("//// hello coover notation");
  //api.log.info(Note.fromMidi(Note.props("E##4").midi, false));

  curScore.startCmd();

  var cursor = curScore.newCursor();
  var startStaff;
  var endStaff;
  var endTick;
  var fullScore = false;
  cursor.rewind(1);
  if (!cursor.segment) {
    // no selection
    fullScore = true;
    startStaff = 0; // start with 1st staff
    endStaff = curScore.nstaves - 1; // and end with last
  } else {
    startStaff = cursor.staffIdx;
    cursor.rewind(2);
    if (cursor.tick === 0) {
      // this happens when the selection includes
      // the last measure of the score.
      // rewind(2) goes behind the last segment (where
      // there's none) and sets tick=0
      endTick = curScore.lastSegment.tick + 1;
    } else {
      endTick = cursor.tick;
    }
    endStaff = cursor.staffIdx;
  }
  console.log(startStaff + " - " + endStaff + " - " + endTick);

  for (var staff = startStaff; staff <= endStaff; staff++) {
    for (var voice = 0; voice < 4; voice++) {
      cursor.rewind(1); // beginning of selection
      cursor.voice = voice;
      cursor.staffIdx = staff;

      if (fullScore)
        // no selection
        cursor.rewind(0); // beginning of score
      while (cursor.segment && (fullScore || cursor.tick < endTick)) {
        if (cursor.element && cursor.element.type === Element.CHORD) {
          // Make a STAFF_TEXT

          // First...we need to scan grace notes for existence and break them
          // into their appropriate lists with the correct ordering of notes.
          // var leadingLifo = Array(); // List for leading grace notes
          // var trailingFifo = Array(); // List for trailing grace notes
          // var graceChords = cursor.element.graceNotes;
          // // Build separate lists of leading and trailing grace note chords.
          // if (graceChords.length > 0) {
          //   for (var chordNum = 0; chordNum < graceChords.length; chordNum++) {
          //     var noteType = graceChords[chordNum].notes[0].noteType;
          //     if (
          //       noteType === NoteType.GRACE8_AFTER ||
          //       noteType === NoteType.GRACE16_AFTER ||
          //       noteType === NoteType.GRACE32_AFTER
          //     ) {
          //       trailingFifo.unshift(graceChords[chordNum]);
          //     } else {
          //       leadingLifo.push(graceChords[chordNum]);
          //     }
          //   }
          // }

          // Next process the leading grace notes, should they exist...
          //text = renderGraceNoteNames(cursor, leadingLifo, text, true);

          // Now handle the note names on the main chord...
          const noteElementCollection = cursor.element.notes;
          const noteElements = Array.from(noteElementCollection);
          const noteNames = noteElements.map(noteElementToNoteName);

          const {
            buttons: pushButtons,
            leftHandButtons: pushLeftHandButtons,
            rightHandButtons: pushRightHandButtons,
          } = getButtonsByNoteNamesAndAction(noteNames, Action.PUSH);

          const {
            buttons: pullButtons,
            leftHandButtons: pullLeftHandButtons,
            rightHandButtons: pullRightHandButtons,
          } = getButtonsByNoteNamesAndAction(noteNames, Action.PULL);

          // color the notes based on the push and pull buttons
          for (i in noteElements) {
            const noteElement = noteElements[i];

            const isNotePushable = pushButtons.some((button) =>
              isNoteNameEqual(button.push, noteNames[i])
            );
            const isNotePullable = pullButtons.some((button) =>
              isNoteNameEqual(button.pull, noteNames[i])
            );

            let color = Colors.actionNone;

            if (isNotePushable && isNotePullable) {
              color = Colors.actionBoth;
            } else if (isNotePushable) {
              color = Colors.actionPush;
            } else if (isNotePullable) {
              color = Colors.actionPull;
            }

            colorNote(noteElement, color);
          }

          const isStaffPushable = pushButtons.length >= noteElements.length;
          const isStaffPullable = pullButtons.length >= noteElements.length;

          function addCooverLabelToNoteElements(props) {
            const {
              leftHandButtons,
              rightHandButtons,
              color,
              offsetX = 0.0,
              placementBelow = Placement.BELOW,
              placementAbove = Placement.ABOVE,
              alignTop = Align.TOP,
              alignBottom = Align.BOTTOM,
              offsetYBelow = 4.0,
              offsetYAbove = -3.3,
              appendText = "",
              preprentText = "",
            } = props;

            const topTextEle = newElement(Element.STAFF_TEXT);
            topTextEle.text =
              preprentText +
              rightHandButtons.map((button) => button.cooverLabel).join("\n");
            topTextEle.autoplace = false;
            topTextEle.placement = placementAbove;
            topTextEle.align = alignBottom;
            topTextEle.offsetY = offsetYAbove;
            topTextEle.color = color;
            topTextEle.offsetX = offsetX;
            cursor.add(topTextEle);

            const bottomTextEle = newElement(Element.STAFF_TEXT);
            bottomTextEle.text =
              [...leftHandButtons.map((button) => button.cooverLabel)].join(
                "\n"
              ) + appendText;
            bottomTextEle.autoplace = false;
            bottomTextEle.placement = placementBelow;
            bottomTextEle.align = alignTop;
            bottomTextEle.offsetY = offsetYBelow;
            bottomTextEle.color = color;
            bottomTextEle.offsetX = offsetX;
            cursor.add(bottomTextEle);
          }

          if (isStaffPushable)
            addCooverLabelToNoteElements({
              leftHandButtons: pushLeftHandButtons,
              rightHandButtons: pushRightHandButtons,
              color: Colors.actionPush,
              //offsetX: !isStaffBothActionable ? 0.0 : -0.5,
            });

          if (isStaffPullable)
            addCooverLabelToNoteElements({
              preprentText: "—\n",
              leftHandButtons: pullLeftHandButtons,
              rightHandButtons: pullRightHandButtons,
              color: Colors.actionPull,
              //offsetX: !isStaffBothActionable ? 0.0 : 0.5,
            });
        }
        cursor.next();
      } // end while segment
    } // end for voice
  } // end for staff

  curScore.endCmd();
}
