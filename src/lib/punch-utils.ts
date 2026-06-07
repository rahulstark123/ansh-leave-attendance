export function formatPunchTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function calculatePunchStatus(pinTime: Date): "On-time" | "Late" {
  const { getSystemSettings } = require("@/lib/settings");
  const settings = getSystemSettings();
  const { shiftStartTime, gracePeriod } = settings.attendanceSettings;

  const [timeStr, modifier] = shiftStartTime.split(" ");
  let [hours, minutes] = timeStr.split(":").map(Number);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const shiftDate = new Date(pinTime);
  shiftDate.setHours(hours, minutes, 0, 0);
  const lateThreshold = new Date(shiftDate.getTime() + gracePeriod * 60 * 1000);

  return pinTime.getTime() > lateThreshold.getTime() ? "Late" : "On-time";
}
