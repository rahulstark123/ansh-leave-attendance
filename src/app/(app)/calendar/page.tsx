"use client";

import { PageHeader } from "@/components/crm/page-header";
import { AttendanceCalendarView } from "@/components/attendance/attendance-calendar-view";

export default function CalendarPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Personal"
        title="My Calendar"
        description="Your monthly view of presence, absences, leaves, and company holidays."
      />
      <AttendanceCalendarView />
    </div>
  );
}
