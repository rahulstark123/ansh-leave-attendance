import { getAuthEmployee } from "@/lib/auth-helper";

export async function getBillingAuthorizedEmployee(req: Request) {
  const employee = await getAuthEmployee(req);
  if (!employee) return null;

  const isAuthorized =
    employee.role === "Admin" ||
    employee.role === "HR Manager" ||
    employee.role === "Owner";

  if (!isAuthorized) return null;

  return employee;
}

export function getEmployeeWorkspaceId(employee: { wid: number | null }): number {
  return employee.wid ?? 1;
}
