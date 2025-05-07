const {
  getButtonsByNoteNamesAndAction,
  noteElementToNoteName,
  isNoteNameEqual,
  colorNote,
} = require("./helpers.js");
const { Colors } = require("./colors.js");
const { Instrument } = require("./instruments.js");
const { Action, ProcessMode } = require("./enums.js");

function processScore(props) {
  api.log.info("//// hello coover notation");
  //api.log.info(Note.fromMidi(Note.props("E##4").midi, false));

  const { mode = ProcessMode.AUTO, instrument = Instrument.WheatstoneCG30 } =
    props;

  const layout = instrument.layout;

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
          } = getButtonsByNoteNamesAndAction(layout, noteNames, Action.PUSH);

          const {
            buttons: pullButtons,
            leftHandButtons: pullLeftHandButtons,
            rightHandButtons: pullRightHandButtons,
          } = getButtonsByNoteNamesAndAction(layout, noteNames, Action.PULL);

          // color the notes based on the push and pull buttons
          for (i in noteElements) {
            const noteElement = noteElements[i];

            const isNotePushable = pushButtons.some((button) =>
              isNoteNameEqual(button[Action.PUSH], noteNames[i])
            );
            const isNotePullable = pullButtons.some((button) =>
              isNoteNameEqual(button[Action.PULL], noteNames[i])
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

          if (ProcessMode.COLOR === mode) {
            cursor.next();
            continue;
          }

          const isStaffPushable = pushButtons.length >= noteElements.length;
          const isStaffPullable = pullButtons.length >= noteElements.length;

          function addCooverLabelToNoteElements(props) {
            const {
              leftHandButtons,
              rightHandButtons,
              color,
              placementBelow = Placement.BELOW,
              placementAbove = Placement.ABOVE,
              alignTop = Align.TOP,
              alignBottom = Align.BOTTOM,
              offsetXAbove = -0.2,
              offsetXBelow = -0.3,
              offsetYBelow = 4.0,
              offsetYAbove = -3.2,
              fontSize = 8.8,
              addPullbar = false,
            } = props;

            const textLine = newElement(Element.TEXTLINE);
            cursor.add(textLine);

            const topTextEle = newElement(Element.STAFF_TEXT);
            topTextEle.text = rightHandButtons
              .map((button) => button.cooverLabel)
              .map((b) => (b.length === 1 ? " " : "") + b)
              .join("\n");
            topTextEle.autoplace = false;
            topTextEle.placement = placementAbove;
            topTextEle.align = alignBottom;
            topTextEle.offsetY = offsetYAbove;
            topTextEle.color = color;
            topTextEle.offsetX = offsetXAbove;
            topTextEle.fontStyle = 1;
            topTextEle.fontSize = fontSize;
            cursor.add(topTextEle);

            if (addPullbar) {
              const pullbarEle = newElement(Element.STAFF_TEXT);
              pullbarEle.text = "—";
              pullbarEle.autoplace = false;
              pullbarEle.placement = placementAbove;
              pullbarEle.align = alignBottom;
              pullbarEle.offsetY =
                offsetYAbove -
                1.3 -
                Math.max(0, rightHandButtons.length - 1) * 2;
              pullbarEle.color = color;
              pullbarEle.offsetX = offsetXAbove;
              pullbarEle.fontStyle = 1;
              pullbarEle.fontSize = fontSize;
              cursor.add(pullbarEle);
            }

            const bottomTextEle = newElement(Element.STAFF_TEXT);
            bottomTextEle.text = [
              ...leftHandButtons
                .map((button) => button.cooverLabel)
                .map((b) => (b.length === 1 ? " " : "") + b),
            ].join("\n");
            bottomTextEle.autoplace = false;
            bottomTextEle.placement = placementBelow;
            bottomTextEle.align = alignTop;
            bottomTextEle.offsetY = offsetYBelow;
            bottomTextEle.color = color;
            bottomTextEle.offsetX = offsetXBelow;
            bottomTextEle.fontStyle = 1;
            bottomTextEle.fontSize = fontSize;
            cursor.add(bottomTextEle);
          }

          if (
            isStaffPushable &&
            [ProcessMode.AUTO, ProcessMode.PUSH].includes(mode)
          )
            addCooverLabelToNoteElements({
              leftHandButtons: pushLeftHandButtons,
              rightHandButtons: pushRightHandButtons,
              color: Colors.actionPush,
              //offsetX: !isStaffBothActionable ? 0.0 : -0.5,
            });

          if (
            isStaffPullable &&
            [ProcessMode.AUTO, ProcessMode.PULL].includes(mode)
          )
            addCooverLabelToNoteElements({
              addPullbar: true,
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

module.exports = { processScore };
