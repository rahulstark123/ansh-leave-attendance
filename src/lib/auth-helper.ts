import { createClient } from "@supabase/supabase-js";
import { prisma } from "./db";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hjnqlybokoljhxyzsqqi.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_GbWUE3qA8Uv80ssHRUKqsQ_FwANa9OY";

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function getAuthUser(req: Request) {
  let token = "";
  const authHeader = req.headers.get("Authorization");
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    try {
      const { searchParams } = new URL(req.url);
      const paramToken = searchParams.get("token");
      if (paramToken) {
        token = paramToken;
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  if (!token) {
    return null;
  }
  
  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
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
