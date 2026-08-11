import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// In-memory store for OTPs (phone -> { otp, expiresAt })
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const { action, phoneNumber, otp } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ message: "Mobile phone number is required." }, { status: 400 });
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);

    if (action === "send") {
      // Generate a 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      otpStore.set(cleanPhone, { otp: generatedOtp, expiresAt });

      console.log(`[OTP API] Sent OTP ${generatedOtp} to +91 ${cleanPhone}`);

      return NextResponse.json({
        success: true,
        message: `OTP sent successfully to +91 ${cleanPhone}`,
        // For smooth testing without SMS gateway charges:
        otpPreview: generatedOtp,
      });
    }

    if (action === "verify") {
      if (!otp) {
        return NextResponse.json({ message: "OTP code is required." }, { status: 400 });
      }

      const stored = otpStore.get(cleanPhone);

      // Allow 123456 as universal test code OR matching generated OTP
      if (otp === "123456" || (stored && stored.otp === otp && Date.now() < stored.expiresAt)) {
        otpStore.delete(cleanPhone);
        return NextResponse.json({ success: true, message: "Mobile number verified successfully!" });
      }

      return NextResponse.json({ message: "Invalid or expired OTP code. Please try again." }, { status: 400 });
    }

    return NextResponse.json({ message: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("OTP API Error:", error);
    return NextResponse.json({ message: "Failed to process OTP request." }, { status: 500 });
  }
}
