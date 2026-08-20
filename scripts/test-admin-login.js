const { prisma } = require("../src/lib/db");

async function test() {
  try {
    console.log("Checking AdminUsers in database...");
    const admins = await prisma.adminUser.findMany();
    console.log("Admins found count:", admins.length);
    console.log("Admins data:", admins.map(a => ({ email: a.email, name: a.name, role: a.role })));
  } catch (err) {
    console.error("Error fetching admin users:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
