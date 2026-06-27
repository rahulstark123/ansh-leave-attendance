import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { buildObjectKey, uploadToR2 } from "@/lib/storage/r2";
import { getPublicObjectUrl } from "@/lib/storage/public-url";
import { isFaceEnrolled } from "@/lib/face-enrollment";
import { resolveCoordsFromRequest } from "@/lib/ip-geolocation";
import { calculatePunchStatus, formatPunchTime } from "@/lib/punch-utils";
import { canWorkspacePunchIn } from "@/lib/billing/workspace-access";

function parseCoord(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wid = employee.wid ?? 1;
    const punches = await prisma.punchRecord.findMany({
      where: { employeeId: employee.id, wid },
      orderBy: [{ date: "desc" }, { id: "desc" }],
    });

    // Backfill open row for employees punched in before create-on-check-in was deployed
    if (employee.currentPunchIn) {
      const hasOpenRecord = punches.some((p) => p.punchOut === null);
      if (!hasOpenRecord) {
        const pinTime = new Date(employee.currentPunchIn);
        const backfilled = await prisma.punchRecord.create({
          data: {
            employeeId: employee.id,
            date: pinTime.toISOString().split("T")[0],
            punchIn: formatPunchTime(pinTime),
            punchOut: null,
            duration: null,
            status: calculatePunchStatus(pinTime),
            wid,
            punchInPhoto: employee.currentPunchInPhoto,
            punchInLat: employee.currentPunchInLat,
            punchInLng: employee.currentPunchInLng,
          },
        });
        punches.unshift(backfilled);
      }
    }

    return NextResponse.json({
      currentPunchIn: employee.currentPunchIn,
      currentPunchInPhoto: employee.currentPunchInPhoto,
      currentPunchInLat: employee.currentPunchInLat,
      currentPunchInLng: employee.currentPunchInLng,
      punchHistory: punches,
      faceEnrolled: isFaceEnrolled(employee.facePhotos, employee.faceEmbedding),
    });
  } catch (error) {
    console.error("API /api/attendance/punch GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const employee = await getAuthEmployee(req);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, selfie, lat, lng } = body; // "punch-in" | "punch-out", selfie is base64 string, lat/lng are coordinates

    let selfieUrl: string | null = null;
    if (selfie) {
      try {
        const matches = selfie.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer: Buffer;
        let contentType = "image/jpeg";
        let extension = "jpg";
        
        if (matches && matches.length === 3) {
          contentType = matches[1];
          extension = contentType.split("/")[1] || "jpg";
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(selfie, 'base64');
        }
        
        const objectKey = buildObjectKey(
          "punches",
          employee.id,
          `${Date.now()}_${action}.${extension}`
        );
        await uploadToR2(objectKey, buffer, contentType);
        selfieUrl = getPublicObjectUrl(objectKey);
      } catch (uploadErr) {
        console.error("Failed to upload punch selfie to storage:", uploadErr);
      }
    }

    // Parse coordinates — browser GPS first, IP geolocation fallback on server
    const clientLat = parseCoord(lat);
    const clientLng = parseCoord(lng);
    const { lat: latitude, lng: longitude } = await resolveCoordsFromRequest(
      req,
      clientLat,
      clientLng
    );

    if (action === "punch-in") {
      if (employee.currentPunchIn) {
        return NextResponse.json({ error: "Already punched in" }, { status: 400 });
      }

      const wid = employee.wid ?? 1;
      const punchCheck = await canWorkspacePunchIn(wid);
      if (!punchCheck.allowed) {
        return NextResponse.json(
          {
            error: punchCheck.reason,
            code: "PUNCH_LIMIT_REACHED",
            punchesUsed: punchCheck.used,
            punchesLimit: punchCheck.limit,
          },
          { status: 403 }
        );
      }

      const pinTime = new Date();
      const status = calculatePunchStatus(pinTime);

      const result = await prisma.$transaction(async (tx) => {
        const punchRecord = await tx.punchRecord.create({
          data: {
            employeeId: employee.id,
            date: pinTime.toISOString().split("T")[0],
            punchIn: formatPunchTime(pinTime),
            punchOut: null,
            duration: null,
            status,
            wid,
            punchInPhoto: selfieUrl,
            punchInLat: latitude,
            punchInLng: longitude,
          },
        });

        const updatedEmployee = await tx.employee.update({
          where: { id: employee.id },
          data: {
            currentPunchIn: pinTime.toISOString(),
            currentPunchInPhoto: selfieUrl,
            currentPunchInLat: latitude,
            currentPunchInLng: longitude,
            status: "Active",
          },
        });

        return { punchRecord, updatedEmployee };
      });

      return NextResponse.json({
        punchRecord: result.punchRecord,
        currentPunchIn: result.updatedEmployee.currentPunchIn,
        currentPunchInPhoto: result.updatedEmployee.currentPunchInPhoto,
        currentPunchInLat: result.updatedEmployee.currentPunchInLat,
        currentPunchInLng: result.updatedEmployee.currentPunchInLng,
        status: result.updatedEmployee.status,
      });
    } else if (action === "punch-out") {
      if (!employee.currentPunchIn) {
        return NextResponse.json({ error: "Not punched in" }, { status: 400 });
      }

      const pinTime = new Date(employee.currentPunchIn);
      const poutTime = new Date();
      const diffMs = poutTime.getTime() - pinTime.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const status = calculatePunchStatus(pinTime);
      const wid = employee.wid ?? 1;

      const punchRecord = await prisma.$transaction(async (tx) => {
        const openRecord = await tx.punchRecord.findFirst({
          where: { employeeId: employee.id, wid, punchOut: null },
          orderBy: [{ date: "desc" }, { id: "desc" }],
        });

        let record;
        if (openRecord) {
          record = await tx.punchRecord.update({
            where: { id: openRecord.id },
            data: {
              punchOut: formatPunchTime(poutTime),
              duration: `${diffHrs}h ${diffMins}m`,
              status,
              punchOutPhoto: selfieUrl,
              punchOutLat: latitude,
              punchOutLng: longitude,
            },
          });
        } else {
          record = await tx.punchRecord.create({
            data: {
              employeeId: employee.id,
              date: pinTime.toISOString().split("T")[0],
              punchIn: formatPunchTime(pinTime),
              punchOut: formatPunchTime(poutTime),
              duration: `${diffHrs}h ${diffMins}m`,
              status,
              wid,
              punchInPhoto: employee.currentPunchInPhoto,
              punchOutPhoto: selfieUrl,
              punchInLat: employee.currentPunchInLat,
              punchInLng: employee.currentPunchInLng,
              punchOutLat: latitude,
              punchOutLng: longitude,
            },
          });
        }

        await tx.employee.update({
          where: { id: employee.id },
          data: {
            currentPunchIn: null,
            currentPunchInPhoto: null,
            currentPunchInLat: null,
            currentPunchInLng: null,
          },
        });

        return record;
      });

      return NextResponse.json({
        punchRecord,
        currentPunchIn: null,
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("API /api/attendance/punch POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
