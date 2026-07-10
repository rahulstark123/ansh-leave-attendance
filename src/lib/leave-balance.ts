export type LeaveCategoryLike = {
  name: string;
  days: number;
  branchId?: string | null;
};

export type LeaveRequestLike = {
  id?: string;
  type: string;
  status: string;
  totalDays: number;
  employeeId?: string;
};

export function getApprovedDaysTaken(
  leaveType: string,
  leaves: LeaveRequestLike[],
  options?: { employeeId?: string; excludeLeaveId?: string }
): number {
  return leaves
    .filter(
      (leave) =>
        leave.type === leaveType &&
        leave.status === "Approved" &&
        leave.id !== options?.excludeLeaveId &&
        (options?.employeeId === undefined || leave.employeeId === options.employeeId)
    )
    .reduce((total, leave) => total + leave.totalDays, 0);
}

export function getAvailableLeaveBalance(
  leaveType: string,
  categories: LeaveCategoryLike[],
  leaves: LeaveRequestLike[],
  options?: { employeeId?: string; excludeLeaveId?: string }
): number | null {
  const category = categories.find((item) => item.name === leaveType);
  if (!category) return null;

  const approvedDaysTaken = getApprovedDaysTaken(leaveType, leaves, options);
  return category.days - approvedDaysTaken;
}
