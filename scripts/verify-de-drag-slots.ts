import {
  isDraggableAthlete,
  isOpenAthleteSlot,
  isPlaceholderAthleteName,
} from "@/lib/tournament-match-slots";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(isPlaceholderAthleteName("TBD"), "TBD is placeholder");
assert(isPlaceholderAthleteName("Winner WB-R1 1"), "Winner prefix is placeholder");
assert(isOpenAthleteSlot(null, "TBD"), "TBD slot is open");
assert(!isOpenAthleteSlot("player-1", "Alice"), "occupied slot is not open");
assert(isDraggableAthlete("player-1", "Alice", false), "real athlete is draggable");
assert(!isDraggableAthlete(null, "TBD", false), "TBD is not draggable");
assert(!isDraggableAthlete("player-1", "Alice", true), "completed match blocks drag");
assert(
  isOpenAthleteSlot(null, "Winners bracket champion"),
  "GF placeholder slot is droppable"
);

console.log("DE drag slot helpers: OK");
