import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "recruitment_portal_super_secret_jwt_key_2026";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { email, password, name, isRegister } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const hashed = hashPassword(password);
    const normalizedEmail = email.toLowerCase().trim();

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/i;
    if (!gmailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Please enter a valid Email address ending with .com (e.g. yourname@gmail.com)." },
        { status: 400 }
      );
    }

    if (isRegister) {
      // Check duplicate email in User or PersonalDetails
      const existingUser = await prisma.user.findFirst({
        where: { email: normalizedEmail },
      });

      const existingApp = await prisma.application.findFirst({
        where: {
          personalDetails: { email: { equals: normalizedEmail, mode: "insensitive" } },
        },
      });

      if (existingUser || existingApp) {
        return NextResponse.json(
          { message: "This Gmail address is already registered. Please click 'Log in with Email'." },
          { status: 400 }
        );
      }

      // Create new user account
      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: hashed,
        },
      });

      // Issue JWT session token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: "APPLICANT" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const response = NextResponse.json({
        success: true,
        user: { id: newUser.id, email: newUser.email, name },
        isSubmitted: false,
      });

      response.cookies.set("applicant_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    } else {
      // LOGIN
      const user = await prisma.user.findFirst({
        where: { email: normalizedEmail },
        include: {
          applications: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!user || user.passwordHash !== hashed) {
        return NextResponse.json(
          { message: "Invalid email or password." },
          { status: 401 }
        );
      }

      const lastApp = user.applications[0];
      const isSubmitted = lastApp ? lastApp.status !== "DRAFT" : false;

      // Issue JWT session token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: "APPLICANT" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const response = NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email },
        isSubmitted,
        applicationNo: lastApp ? lastApp.applicationNo : null,
      });

      response.cookies.set("applicant_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    }
  } catch (error: any) {
    console.error("Email Auth Error:", error);
    return NextResponse.json(
      { message: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
