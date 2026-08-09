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
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password required." }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    const hashed = hashPassword(password);
    if (hashed !== admin.passwordHash) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    // Sign JWT token
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    const response = NextResponse.json({
      success: true,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });

    // Set secure HTTP-only cookie
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Admin Login Error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
