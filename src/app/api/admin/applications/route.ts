import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendApprovalEmail } from "@/lib/email-service";
import crypto from "crypto";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.categoryId = category;
    }

    if (search) {
      where.OR = [
        { applicationNo: { contains: search, mode: "insensitive" } },
        { user: { phoneNumber: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        {
          personalDetails: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { aadhaarNumber: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const dbApplications = await prisma.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, phoneNumber: true, plainPassword: true, passwordHash: true, createdAt: true } },
        category: { select: { id: true, name: true } },
        personalDetails: true,
        documents: { select: { id: true, applicationId: true, documentType: true, fileSize: true, uploadedAt: true } },
        educationDetails: true,
        employmentDetails: true,
      },
    });

    const registeredUsers = await prisma.user.findMany({
      include: {
        applications: {
          include: {
            category: { select: { id: true, name: true } },
            personalDetails: true,
            documents: { select: { id: true, applicationId: true, documentType: true, fileSize: true, uploadedAt: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedApplications = dbApplications.map((app) => ({
      ...app,
      documents: app.documents.map((d) => ({
        ...d,
        fileUrl: `/api/documents/${d.id}`,
      })),
    }));

    const masterList: any[] = [];
    const processedUserIds = new Set<string>();

    for (const app of formattedApplications) {
      masterList.push(app);
      if (app.userId) processedUserIds.add(app.userId);
    }

    // Only add registered users who haven't submitted a form yet, WITHOUT any fake dummy data
    for (const u of registeredUsers) {
      if (!processedUserIds.has(u.id)) {
        masterList.push({
          id: `temp-${u.id}`,
          applicationNo: `REG-${u.id.substring(0, 6).toUpperCase()}`,
          status: "DRAFT",
          createdAt: u.createdAt,
          userId: u.id,
          user: {
            id: u.id,
            email: u.email || "N/A",
            phoneNumber: u.phoneNumber || "N/A",
          },
          category: { name: "Not Selected Yet" },
          personalDetails: null, // NO DUMMY FAKE PERSONAL DATA
          documents: [],
        });
      }
    }

    return NextResponse.json({
      applications: masterList,
      registeredUsers: registeredUsers.map((u) => ({
        id: u.id,
        email: u.email || "N/A",
        phoneNumber: u.phoneNumber || "N/A",
        registeredAt: u.createdAt,
        applicationCount: u.applications.length,
        hasSubmitted: u.applications.some((a) => a.status !== "DRAFT"),
      })),
    });
  } catch (error: any) {
    console.error("Fetch Applications Error:", error);
    return NextResponse.json({ message: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { applicationId, status, remarks, adminId, newPassword } = await req.json();

    if (!applicationId) {
      return NextResponse.json(
        { message: "Application ID is required." },
        { status: 400 }
      );
    }

    // Handle temporary registration rows seamlessly
    if (applicationId.startsWith("temp-")) {
      const realUserId = applicationId.replace("temp-", "");

      let peonCategory = await prisma.category.findFirst({ where: { name: "Peon" } });
      if (!peonCategory) {
        peonCategory = await prisma.category.create({ data: { name: "Peon", description: "Peon position" } });
      }

      const existingApp = await prisma.application.findFirst({
        where: { userId: realUserId },
      });

      let finalApp;
      if (existingApp) {
        finalApp = await prisma.application.update({
          where: { id: existingApp.id },
          data: { status },
          include: { personalDetails: true, documents: true, user: true },
        });
      } else {
        const userObj = await prisma.user.findUnique({ where: { id: realUserId } });
        finalApp = await prisma.application.create({
          data: {
            applicationNo: `APP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
            userId: realUserId,
            categoryId: peonCategory.id,
            status,
          },
          include: { personalDetails: true, documents: true, user: true },
        });
      }

      if (newPassword) {
        await prisma.user.update({
          where: { id: realUserId },
          data: {
            passwordHash: hashPassword(newPassword),
            plainPassword: newPassword,
          },
        });
      }

      return NextResponse.json({ success: true, application: finalApp });
    }

    const updatedApp = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        statusHistory: status
          ? {
              create: {
                newStatus: status,
                changedBy: adminId || "Super Admin",
                remarks: remarks || `Status updated to ${status}`,
              },
            }
          : undefined,
      },
      include: {
        personalDetails: true,
        documents: true,
        user: true,
      },
    });

    if (newPassword && updatedApp.userId) {
      await prisma.user.update({
        where: { id: updatedApp.userId },
        data: {
          passwordHash: hashPassword(newPassword),
          plainPassword: newPassword,
        },
      });
    }

    if (status === "APPROVED") {
      const recipient = updatedApp.personalDetails?.email || updatedApp.user?.email;
      if (recipient) {
        const applicantName = updatedApp.personalDetails?.firstName
          ? `${updatedApp.personalDetails.firstName} ${updatedApp.personalDetails.lastName || ""}`
          : "Applicant";
        await sendApprovalEmail({
          recipientEmail: recipient,
          applicantName,
          applicationNo: updatedApp.applicationNo,
          categoryName: (updatedApp as any).category?.name,
        });
      }
    }

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (error: any) {
    console.error("Update Application Error:", error);
    return NextResponse.json({ message: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("id");
    const userId = searchParams.get("userId");
    const purge = searchParams.get("purge");

    if (purge === "all") {
      await prisma.document.deleteMany({});
      await prisma.personalDetails.deleteMany({});
      await prisma.educationalDetails.deleteMany({});
      await prisma.employmentDetails.deleteMany({});
      await prisma.applicationStatusHistory.deleteMany({});
      await prisma.application.deleteMany({});
      await prisma.notification.deleteMany({});
      await prisma.user.deleteMany({});
      return NextResponse.json({ success: true, message: "All uploaded files and applications purged successfully!" });
    }

    if (applicationId) {
      if (applicationId.startsWith("temp-")) {
        const realUserId = applicationId.replace("temp-", "");
        await prisma.user.delete({ where: { id: realUserId } });
        return NextResponse.json({ success: true, message: "User deleted successfully." });
      }
      await prisma.application.delete({
        where: { id: applicationId },
      });
      return NextResponse.json({ success: true, message: "Application deleted successfully." });
    }

    if (userId) {
      await prisma.user.delete({
        where: { id: userId },
      });
      return NextResponse.json({ success: true, message: "User account deleted successfully." });
    }

    return NextResponse.json({ message: "ID or UserId is required." }, { status: 400 });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ message: "Failed to delete record" }, { status: 500 });
  }
}
