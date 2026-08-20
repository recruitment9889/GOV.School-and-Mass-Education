import "dotenv/config";
import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const DEFAULT_DB_URL = "postgresql://neondb_owner:npg_2anKBE6IOkpx@ep-flat-frost-b3otwt6h.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || DEFAULT_DB_URL;

const pool = new pg.Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
