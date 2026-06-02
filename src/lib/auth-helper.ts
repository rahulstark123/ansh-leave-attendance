import { supabase } from "./supabase/client";
import { prisma } from "./db";

export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch (err) {
    console.error("Auth helper verification error:", err);
    return null;
  }
}

export async function getAuthEmployee(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return null;

  try {
    const loggedInEmployee = await prisma.employee.findUnique({
      where: { id: user.id },
    });

    if (!loggedInEmployee) return null;

    // Impersonate check: allow Admin/HR Manager for any request, or standard employees for GET requests only
    const impersonateHeader = req.headers.get("X-Impersonate-User");
    if (impersonateHeader && impersonateHeader !== loggedInEmployee.id) {
      const isGetRequest = req.method === "GET";
      const isManagement = loggedInEmployee.role === "Admin" || loggedInEmployee.role === "HR Manager" || loggedInEmployee.role === "Owner";
      if (isGetRequest || isManagement) {
        const impersonated = await prisma.employee.findUnique({
          where: { id: impersonateHeader },
        });
        if (impersonated) return impersonated;
      }
    }

    return loggedInEmployee;
  } catch (err) {
    console.error("Auth helper database lookup error:", err);
    return null;
  }
}
