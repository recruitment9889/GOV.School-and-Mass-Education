import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalApplications,
      applicationsToday,
      underReviewCount,
      approvedCount,
      rejectedCount,
      peonCount,
      clerkCount,
    ] = await Promise.all([
      // 1. Registered Accounts
      prisma.user.count(),
      // 2. Total Actual Submitted Applications (Excluding unsubmitted draft/registrations)
      prisma.application.count({
        where: { status: { not: "DRAFT" } },
      }),
      // 3. Applications Submitted Today
      prisma.application.count({
        where: {
          status: { not: "DRAFT" },
          createdAt: { gte: todayStart },
        },
      }),
      // 4. Applications Under Review or Submitted
      prisma.application.count({
        where: { status: { in: ["UNDER_REVIEW", "SUBMITTED"] } },
      }),
      // 5. Approved Applications
      prisma.application.count({
        where: { status: "APPROVED" },
      }),
      // 6. Rejected Applications
      prisma.application.count({
        where: { status: "REJECTED" },
      }),
      // 7. Peon Position Submitted Count
      prisma.application.count({
        where: {
          category: { name: "Peon" },
          status: { not: "DRAFT" },
        },
      }),
      // 8. Clerk Position Submitted Count
      prisma.application.count({
        where: {
          category: { name: "Clerk" },
          status: { not: "DRAFT" },
        },
      }),
    ]);

    const totalSubmitted = peonCount + clerkCount;

    const categoryBreakdown = [
      {
        name: "Peon",
        count: peonCount,
        percent: totalSubmitted > 0 ? Math.round((peonCount / totalSubmitted) * 100) : 0,
      },
      {
        name: "Clerk",
        count: clerkCount,
        percent: totalSubmitted > 0 ? Math.round((clerkCount / totalSubmitted) * 100) : 0,
      },
    ];

    return NextResponse.json({
      stats: {
        totalUsers,
        totalApplications,
        applicationsToday,
        submittedCount: totalApplications,
        underReviewCount,
        approvedCount,
        rejectedCount,
      },
      categoryBreakdown,
    });
  } catch (error: any) {
    console.error("Admin Stats API Error:", error);
    return NextResponse.json({ message: "Failed to fetch stats" }, { status: 500 });
  }
}
