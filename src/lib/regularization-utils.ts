import { getSystemSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";

export function parseTimeStr(timeStr: string): number {
  const parts = timeStr.split(" ");
  if (parts.length !== 2) return 0;
  const [time, modifier] = parts;
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function calculateShiftDuration(requestedIn: string, requestedOut: string): string {
  const checkInMinutes = parseTimeStr(requestedIn);
  const checkOutMinutes = parseTimeStr(requestedOut);
  const diffMinutes = Math.max(0, checkOutMinutes - checkInMinutes);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export async function resolveDefaultShiftTimes(
  employeeId: string,
  wid: number
): Promise<{ punchIn: string; punchOut: string }> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { rosterShift: true },
  });

  if (employee?.rosterShift) {
    const shift = await prisma.shift.findFirst({
      where: { wid, name: employee.rosterShift },
    });
    if (shift) {
      return { punchIn: shift.startTime, punchOut: shift.endTime };
    }
  }

  const { attendanceSettings } = getSystemSettings();
  const workingHours = attendanceSettings.workingHours ?? 9;
  const startMinutes = parseTimeStr(attendanceSettings.shiftStartTime);
  const endTotalMinutes = startMinutes + workingHours * 60;
  const endHours = Math.floor(endTotalMinutes / 60) % 24;
  const endMins = endTotalMinutes % 60;
  const endModifier = endHours >= 12 ? "PM" : "AM";
  const displayHours = endHours % 12 || 12;

  return {
    punchIn: attendanceSettings.shiftStartTime,
    punchOut: `${displayHours.toString().padStart(2, "0")}:${endMins
      .toString()
      .padStart(2, "0")} ${endModifier}`,
  };
}

export function ampmToTimeInput(timeStr: string): string {
  const parts = timeStr.split(" ");
  if (parts.length !== 2) return "09:00";
  const [time, modifier] = parts;
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
