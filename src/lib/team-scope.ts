import { prisma } from "@/lib/db";

type ScopeEmployee = {
  id: string;
  name: string;
  role: string;
  wid?: number | null;
};

/** Admin/Owner → all workspace; Manager/HR → self + reports; else → self only. */
export async function getAccessibleEmployeeIds(
  employee: ScopeEmployee
): Promise<string[] | "all"> {
  const wid = employee.wid ?? 1;

  if (employee.role === "Admin" || employee.role === "Owner") {
    return "all";
  }

  if (employee.role === "Manager" || employee.role === "HR Manager") {
    const reports = await prisma.employee.findMany({
      where: {
        wid,
        OR: [
          { id: employee.id },
          { reportingManager: { equals: employee.name, mode: "insensitive" } },
          { reportingHR: { equals: employee.name, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    return reports.map((r) => r.id);
  }

  return [employee.id];
}

export async function canAccessEmployee(
  viewer: ScopeEmployee,
  targetEmployeeId: string
): Promise<boolean> {
  const accessible = await getAccessibleEmployeeIds(viewer);
  if (accessible === "all") {
    const wid = viewer.wid ?? 1;
    const target = await prisma.employee.findFirst({
      where: { id: targetEmployeeId, wid },
      select: { id: true },
    });
    return !!target;
  }
  return accessible.includes(targetEmployeeId);
}
