const { prisma } = require("../src/lib/db");
const crypto = require("crypto");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function testLogin() {
  try {
    const cleanEmail = "admin@example.com";
    const password = "Admin@2026";
    console.log("Looking up admin:", cleanEmail);

    let admin = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    console.log("Admin lookup result:", admin);

    if (!admin) {
      console.log("Creating admin...");
      admin = await prisma.adminUser.create({
        data: {
          email: cleanEmail,
          name: "Super Admin Officer",
          passwordHash: hashPassword("Admin@2026"),
          role: "SUPERADMIN",
        },
      });
      console.log("Admin created:", admin);
    } else {
      console.log("Admin found. Current hash:", admin.passwordHash);
      const inputHash = hashPassword(password);
      console.log("Input hash:", inputHash);
      console.log("Match?", inputHash === admin.passwordHash);
    }
  } catch (err) {
    console.error("Test login error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
