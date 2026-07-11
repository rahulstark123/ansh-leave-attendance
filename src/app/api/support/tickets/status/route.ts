import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";

/**
 * Workspace users cannot change ticket status/priority.
 * Only ANSH platform support (adminpanel) can update these fields.
 */
export async function PATCH() {
  return NextResponse.json(
    {
      error:
        "Status and priority can only be updated by ANSH Support. Please reply on the ticket instead.",
    },
    { status: 403 }
  );
}
