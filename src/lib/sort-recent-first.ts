function parsePunchInTimestamp(date: string, punchIn: string): number {
  const [timePart, modifier] = punchIn.split(" ");
  if (!timePart || !modifier) return new Date(date).getTime();

  let [hours, minutes] = timePart.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return new Date(date).getTime();

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const parsed = new Date(date);
  parsed.setHours(hours, minutes, 0, 0);
  return parsed.getTime();
}

/** Attendance punch logs — newest work date and check-in first. */
export function sortPunchRecordsRecentFirst<
  T extends { id: string; date: string; punchIn: string },
>(records: T[]): T[] {
  return [...records].sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;

    const timeCmp =
      parsePunchInTimestamp(b.date, b.punchIn) - parsePunchInTimestamp(a.date, a.punchIn);
    if (timeCmp !== 0) return timeCmp;

    return b.id.localeCompare(a.id);
  });
}

/** Leave / WFH / regularization requests — newest application first. */
export function sortByAppliedAtRecentFirst<T extends { appliedAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  );
}

/** Date-only records (e.g. holidays list) — newest date first. */
export function sortByDateStringRecentFirst<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

/** Records with createdAt — newest first. */
export function sortByCreatedAtRecentFirst<
  T extends { createdAt: string | Date },
>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
