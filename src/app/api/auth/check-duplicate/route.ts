import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, phoneNumber, aadhaarNumber, panNumber } = await req.json();

    // 1. Check Duplicate Email
    if (email) {
      const existingApp = await prisma.application.findFirst({
        where: {
          personalDetails: {
            email: { equals: email, mode: "insensitive" },
          },
        },
        include: { personalDetails: true },
      });

      if (existingApp) {
        return NextResponse.json({
          isDuplicate: true,
          isSubmitted: existingApp.status !== "DRAFT",
          applicationNo: existingApp.applicationNo,
          message: existingApp.status !== "DRAFT"
            ? `Your application has already been submitted (${existingApp.applicationNo}).`
            : "This Gmail address is already registered.",
        });
      }
    }

    // 2. Check Duplicate Mobile Phone Number
    if (phoneNumber) {
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      const existingUser = await prisma.user.findFirst({
        where: { phoneNumber: formattedPhone },
        include: {
          applications: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (existingUser && existingUser.applications.length > 0) {
        const lastApp = existingUser.applications[0];
        return NextResponse.json({
          isDuplicate: true,
          isSubmitted: lastApp.status !== "DRAFT",
          applicationNo: lastApp.applicationNo,
          message: lastApp.status !== "DRAFT"
            ? `This mobile number is already registered and an application (${lastApp.applicationNo}) has been submitted.`
            : "This mobile number is already registered.",
        });
      }
    }

    // 3. Check Duplicate Aadhaar Card Number
    if (aadhaarNumber) {
      const existingAadhaar = await prisma.personalDetails.findFirst({
        where: { aadhaarNumber: aadhaarNumber.trim() },
        include: { application: true },
      });

      if (existingAadhaar) {
        return NextResponse.json({
          isDuplicate: true,
          message: `This Aadhaar Card Number (${aadhaarNumber}) is already registered in application ${existingAadhaar.application.applicationNo}. Duplicate Aadhaar numbers are not allowed.`,
        });
      }
    }

    // 4. Check Duplicate PAN Card Number
    if (panNumber) {
      const existingPan = await prisma.personalDetails.findFirst({
        where: { panNumber: panNumber.trim().toUpperCase() },
        include: { application: true },
      });

      if (existingPan) {
        return NextResponse.json({
          isDuplicate: true,
          message: `This PAN Card Number (${panNumber.toUpperCase()}) is already registered in application ${existingPan.application.applicationNo}. Duplicate PAN numbers are not allowed.`,
        });
      }
    }

    return NextResponse.json({ isDuplicate: false, isSubmitted: false });
  } catch (error: any) {
    console.error("Check Duplicate Error:", error);
    return NextResponse.json({ isDuplicate: false });
  }
}
