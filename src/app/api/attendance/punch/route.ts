import { NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-helper";
import { prisma } from "@/lib/db";
import { s3Client, BUCKET_NAME } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { isFaceEnrolled } from "@/lib/face-enrollment";
import { resolveCoordsFromRequest } from "@/lib/ip-geolocation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hjnqlybokoljhxyzsqqi.supabase.co";

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
      orderBy: { date: "desc" },
    });

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
        
        const s3Key = `punches/${employee.id}/${Date.now()}_${action}.${extension}`;
        const uploadCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: contentType,
        });
        await s3Client.send(uploadCommand);
        
        selfieUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${s3Key}`;
      } catch (uploadErr) {
        console.error("Failed to upload punch selfie to S3:", uploadErr);
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

      const updatedEmployee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          currentPunchIn: new Date().toISOString(),
          currentPunchInPhoto: selfieUrl,
          currentPunchInLat: latitude,
          currentPunchInLng: longitude,
          status: "Active",
        },
      });

      return NextResponse.json({
        currentPunchIn: updatedEmployee.currentPunchIn,
        currentPunchInPhoto: updatedEmployee.currentPunchInPhoto,
        currentPunchInLat: updatedEmployee.currentPunchInLat,
        currentPunchInLng: updatedEmployee.currentPunchInLng,
        status: updatedEmployee.status,
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

      const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      };

      const { getSystemSettings } = require("@/lib/settings");
      const settings = getSystemSettings();
      const { shiftStartTime, gracePeriod } = settings.attendanceSettings;

      // Parse shiftStartTime e.g. "09:00 AM"
      const [timeStr, modifier] = shiftStartTime.split(" ");
      let [hours, minutes] = timeStr.split(":").map(Number);
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      // Create a date object for the shift start time on the check-in day
      const shiftDate = new Date(pinTime);
      shiftDate.setHours(hours, minutes, 0, 0);

      // Add grace period in milliseconds
      const lateThreshold = new Date(shiftDate.getTime() + gracePeriod * 60 * 1000);

      const status = pinTime.getTime() > lateThreshold.getTime() ? "Late" : "On-time";

      const punchRecord = await prisma.$transaction(async (tx) => {
        const record = await tx.punchRecord.create({
          data: {
            employeeId: employee.id,
            date: pinTime.toISOString().split("T")[0],
            punchIn: formatTime(pinTime),
            punchOut: formatTime(poutTime),
            duration: `${diffHrs}h ${diffMins}m`,
            status: status,
            wid: employee.wid ?? 1,
            punchInPhoto: employee.currentPunchInPhoto,
            punchOutPhoto: selfieUrl,
            punchInLat: employee.currentPunchInLat,
            punchInLng: employee.currentPunchInLng,
            punchOutLat: latitude,
            punchOutLng: longitude,
          },
        });

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
