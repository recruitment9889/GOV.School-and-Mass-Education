import "dotenv/config";
import dns from "dns";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const pool = new pg.Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning old database categories...");

  // Delete non-Peon and non-Clerk categories
  await prisma.category.deleteMany({
    where: {
      name: { notIn: ["Peon", "Clerk"] }
    }
  });

  // Ensure Peon and Clerk exist
  const categories = [
    { name: "Peon", description: "Office Attendant / Peon position" },
    { name: "Clerk", description: "Junior Clerk / Office Assistant position" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
  }

  console.log("✔ Database now contains ONLY Peon and Clerk categories.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
