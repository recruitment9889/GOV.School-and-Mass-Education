import "dotenv/config";
import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const DEFAULT_DB_URL = "postgresql://postgres.wswnolhapvqwdpnfniqp:%40Santosh98210@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || DEFAULT_DB_URL;

const pool = new pg.Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
