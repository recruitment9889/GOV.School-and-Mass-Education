import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY || "re_build_placeholder_key";
const resend = new Resend(resendKey);

function generateAppNo() {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `APP-2026-${randomDigits}`;
}

const VALID_DOC_TYPES = ["PHOTO", "SIGNATURE", "AADHAAR", "PAN", "DEGREE_CERT", "EXPERIENCE_CERT", "CASTE_CERT", "OTHER"];

function mapDocType(key: string): any {
  if (VALID_DOC_TYPES.includes(key)) return key;
  if (key === "PAN_IMAGE") return "PAN";
  if (key === "CASTE_CERTIFICATE") return "CASTE_CERT";
  if (key === "MARKSHEET_CERTIFICATE" || key === "EDUCATIONAL_CERTIFICATE" || key === "COMPUTER_PGDCA") return "DEGREE_CERT";
  return "OTHER";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      phoneNumber,
      personalDetails,
      educationalDetails,
      employmentDetails,
      documents,
      isDraft,
    } = body;

    const email = personalDetails?.email || null;

    // 1. Get or resolve Category by name
    const categoryName = body.categoryName || "Peon";
    let category = await prisma.category.findUnique({
      where: { name: categoryName },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, description: `${categoryName} Position` },
      });
    }

    // 2. Get or create User by phone or email
    let user = null;
    if (phoneNumber && phoneNumber !== "+919876543210") {
      user = await prisma.user.findFirst({ where: { phoneNumber } });
    }
    if (!user && email) {
      user = await prisma.user.findFirst({
        where: { email: { equals: email.trim(), mode: "insensitive" } },
      });
    }
    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: phoneNumber || "+919876543210",
          email: email ? email.trim() : null,
        },
      });
    } else if (email || phoneNumber) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: email ? email.trim() : user.email,
          phoneNumber: phoneNumber && phoneNumber !== "+919876543210" ? phoneNumber : user.phoneNumber,
        },
      });
    }

    // Lock application resolution to existing user application by userId or email to prevent number fluctuation
    let existingApp = await prisma.application.findFirst({
      where: {
        OR: [
          { userId: user.id },
          ...(email ? [{ personalDetails: { email: { equals: email.trim(), mode: "insensitive" as const } } }] : []),
          ...(email ? [{ user: { email: { equals: email.trim(), mode: "insensitive" as const } } }] : []),
        ],
      },
      include: { personalDetails: true },
      orderBy: { createdAt: "desc" },
    });

    const applicationNo = existingApp ? existingApp.applicationNo : generateAppNo();
    const appStatus = isDraft ? "DRAFT" : "SUBMITTED";

    let application;

    if (existingApp) {
      // Clear existing document records before replacing with new uploaded documents
      if (documents && documents.length > 0) {
        await prisma.document.deleteMany({
          where: { applicationId: existingApp.id },
        });
      }

      if (educationalDetails && educationalDetails.length > 0) {
        await prisma.educationalDetails.deleteMany({
          where: { applicationId: existingApp.id },
        });
      }

      if (documents && documents.length > 0) {
        await prisma.document.deleteMany({
          where: { applicationId: existingApp.id },
        });
      }

      // Update existing application AND save uploaded documents
      application = await prisma.application.update({
        where: { id: existingApp.id },
        data: {
          categoryId: category.id,
          status: appStatus,
          submittedAt: isDraft ? null : new Date(),
          personalDetails: personalDetails
            ? {
                upsert: {
                  create: {
                    firstName: personalDetails.firstName || "",
                    lastName: personalDetails.lastName || "",
                    dateOfBirth: personalDetails.dateOfBirth
                      ? new Date(personalDetails.dateOfBirth)
                      : new Date(),
                    gender: personalDetails.gender || "MALE",
                    aadhaarNumber: personalDetails.aadhaarNumber || null,
                    panNumber: personalDetails.panNumber || null,
                    email: personalDetails.email || null,
                    address: personalDetails.bankAccountNumber
                      ? `${personalDetails.address || ""} (Bank Acc: ${personalDetails.bankAccountNumber})`
                      : personalDetails.address || "",
                    district: personalDetails.district || null,
                    block: personalDetails.block || null,
                    schoolName: personalDetails.schoolName || null,
                    city: personalDetails.city || "Bhubaneswar",
                    state: personalDetails.state || "Odisha",
                    pincode: personalDetails.pincode || "751001",
                  },
                  update: {
                    firstName: personalDetails.firstName || "",
                    lastName: personalDetails.lastName || "",
                    dateOfBirth: personalDetails.dateOfBirth
                      ? new Date(personalDetails.dateOfBirth)
                      : new Date(),
                    gender: personalDetails.gender || "MALE",
                    aadhaarNumber: personalDetails.aadhaarNumber || null,
                    panNumber: personalDetails.panNumber || null,
                    email: personalDetails.email || null,
                    district: personalDetails.district || null,
                    block: personalDetails.block || null,
                    schoolName: personalDetails.schoolName || null,
                    address: personalDetails.bankAccountNumber
                      ? `${personalDetails.address || ""} (Bank Acc: ${personalDetails.bankAccountNumber})`
                      : personalDetails.address || "",
                  },
                },
              }
            : undefined,
          educationDetails: educationalDetails && educationalDetails.length > 0
            ? {
                create: educationalDetails.map((edu: any) => ({
                  degree: edu.degree,
                  institution: edu.institution,
                  yearOfPassing: Number(edu.yearOfPassing),
                  percentage: Number(edu.percentage),
                })),
              }
            : undefined,
          documents: documents && documents.length > 0
            ? {
                create: documents.map((doc: any) => ({
                  documentType: mapDocType(doc.documentType),
                  fileUrl: doc.fileUrl,
                  fileSize: doc.fileSize || 0,
                })),
              }
            : undefined,
        },
        include: { personalDetails: true, category: true, documents: true, educationDetails: true },
      });
    } else {
      // Create new application record with documents
      application = await prisma.application.create({
        data: {
          applicationNo,
          userId: user.id,
          categoryId: category.id,
          status: appStatus,
          submittedAt: isDraft ? null : new Date(),
          personalDetails: personalDetails
            ? {
                create: {
                  firstName: personalDetails.firstName || "",
                  lastName: personalDetails.lastName || "",
                  dateOfBirth: personalDetails.dateOfBirth
                    ? new Date(personalDetails.dateOfBirth)
                    : new Date(),
                  gender: personalDetails.gender || "MALE",
                  aadhaarNumber: personalDetails.aadhaarNumber || null,
                  panNumber: personalDetails.panNumber || null,
                  email: personalDetails.email || null,
                  district: personalDetails.district || null,
                  block: personalDetails.block || null,
                  schoolName: personalDetails.schoolName || null,
                  address: personalDetails.bankAccountNumber
                    ? `${personalDetails.address || ""} (Bank Acc: ${personalDetails.bankAccountNumber})`
                    : personalDetails.address || "",
                  city: personalDetails.city || "Bhubaneswar",
                  state: personalDetails.state || "Odisha",
                  pincode: personalDetails.pincode || "751001",
                },
              }
            : undefined,
          educationDetails: educationalDetails
            ? {
                create: educationalDetails.map((edu: any) => ({
                  degree: edu.degree,
                  institution: edu.institution,
                  yearOfPassing: Number(edu.yearOfPassing),
                  percentage: Number(edu.percentage),
                })),
              }
            : undefined,
          documents: documents
            ? {
                create: documents.map((doc: any) => ({
                  documentType: mapDocType(doc.documentType),
                  fileUrl: doc.fileUrl,
                  fileSize: doc.fileSize || 0,
                })),
              }
            : undefined,
        },
        include: { personalDetails: true, category: true, documents: true, educationDetails: true },
      });
    }

    // Send email notification if Resend API key is available
    if (!isDraft && personalDetails?.email) {
      try {
        await resend.emails.send({
          from: "Online Recruitment <onboarding@resend.dev>",
          to: [personalDetails.email],
          subject: `Application Submitted - ${application.applicationNo}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2>Application Submitted Successfully</h2>
              <p>Dear ${personalDetails.firstName} ${personalDetails.lastName},</p>
              <p>Your application number is <strong>${application.applicationNo}</strong> for position <strong>${category.name}</strong>.</p>
            </div>
          `,
        });
      } catch (e) {
        // silent email fallback
      }
    }

    return NextResponse.json({
      success: true,
      applicationNo: application.applicationNo,
      application,
    });
  } catch (error: any) {
    console.error("Submit Application Error:", error);
    return NextResponse.json({ message: "Failed to submit application" }, { status: 500 });
  }
}
