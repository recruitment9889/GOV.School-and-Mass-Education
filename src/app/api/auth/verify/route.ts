import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminAuth } from "@/lib/firebase-admin";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "recruitment_portal_super_secret_jwt_key_2026";
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ message: "Firebase ID token is required." }, { status: 400 });
    }

    let phoneNumber: string | undefined;
    let firebaseUid: string | undefined;

    // 1. Try verification with Firebase Admin SDK
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      phoneNumber = decoded.phone_number;
      firebaseUid = decoded.uid;
    } catch (adminErr: any) {
      console.warn("Firebase Admin SDK token verification warning, using Identity Toolkit API fallback:", adminErr.message);

      // 2. Fallback: Verify ID token using Google Identity Toolkit REST API
      if (FIREBASE_API_KEY) {
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.users && data.users.length > 0) {
            const fbUser = data.users[0];
            phoneNumber = fbUser.phoneNumber;
            firebaseUid = fbUser.localId;
          }
        }
      }
    }

    if (!phoneNumber && !firebaseUid) {
      return NextResponse.json(
        { message: "Invalid or expired Firebase ID token." },
        { status: 401 }
      );
    }

    // Ensure phone number exists (if test user or missing country code)
    const formattedPhone = phoneNumber || `+91${firebaseUid?.substring(0, 10)}`;

    // 3. Find or create user in database
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: formattedPhone },
          firebaseUid ? { firebaseUid } : { phoneNumber: formattedPhone },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: formattedPhone,
          firebaseUid: firebaseUid || null,
        },
      });
    } else if (firebaseUid && !user.firebaseUid) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid },
      });
    }

    // 4. Create session JWT
    const sessionToken = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber, role: "APPLICANT" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, phoneNumber: user.phoneNumber },
    });

    // 5. Set HTTP-Only Cookie
    response.cookies.set("applicant_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Auth Verification Error:", error);
    return NextResponse.json({ message: error.message || "Authentication failed" }, { status: 500 });
  }
}
