// Assumes that 08:00 - 09:00 and 09:00 - 10:00 do not overlap
// Assumes that begin <= end
export function isOverlapping(a: DateRange, b: DateRange) {
  if (a.begin >= b.end || b.begin >= a.end) {
    return false;
  }
  return true;
}

type DateRange = {
  begin: Date;
  end: Date;
};
