import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new Response("Document ID is required", { status: 400 });
    }

    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc || !doc.fileUrl) {
      return new Response("Document not found", { status: 404 });
    }

    // If it's a data URL (e.g. data:image/png;base64,... or data:application/pdf;base64,...)
    if (doc.fileUrl.startsWith("data:")) {
      const parts = doc.fileUrl.split(";base64,");
      const mimeType = parts[0].replace("data:", "");
      const base64Data = parts[1] || "";
      const buffer = Buffer.from(base64Data, "base64");

      const extension = mimeType.split("/")[1] || "file";
      const filename = `${doc.documentType}_${doc.id.substring(0, 8)}.${extension}`;

      return new Response(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // If it's a standard URL, redirect to it
    if (doc.fileUrl.startsWith("http://") || doc.fileUrl.startsWith("https://")) {
      return NextResponse.redirect(doc.fileUrl);
    }

    return new Response("Invalid document URL format", { status: 400 });
  } catch (error: any) {
    console.error("Document serving error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
