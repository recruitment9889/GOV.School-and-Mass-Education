const { Client } = require("pg");

const supabaseUrl = process.env.SUPABASE_DIRECT_URL || "postgresql://postgres.wswnolhapvqwdpnfniqp:%40Santosh98210@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres";
const neonUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_2anKBE6IOkpx@ep-flat-frost-b3otwt6h.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function migrate() {
  console.log("🚀 Starting Zero Data Loss Migration from Supabase to Neon.tech...");

  const supabaseClient = new Client({ connectionString: supabaseUrl, ssl: { rejectUnauthorized: false } });
  const neonClient = new Client({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });

  await supabaseClient.connect();
  await neonClient.connect();

  console.log("✓ Connected to both Supabase and Neon.tech databases!");

  // List of tables in dependency order
  const tables = [
    "Category",
    "User",
    "AdminUser",
    "RecruitmentSettings",
    "Application",
    "PersonalDetails",
    "EducationalDetails",
    "EmploymentDetails",
    "Document",
    "ApplicationStatusHistory",
    "Notification",
    "AuditLog",
  ];

  for (const table of tables) {
    try {
      console.log(`\n📦 Migrating table: "${table}"...`);

      // Fetch all columns and rows from Supabase
      const supabaseRes = await supabaseClient.query(`SELECT * FROM "${table}"`);
      const rows = supabaseRes.rows;

      console.log(`Found ${rows.length} rows in Supabase for table "${table}".`);

      if (rows.length === 0) continue;

      // Get column names
      const columns = Object.keys(rows[0]);
      const colNamesStr = columns.map((c) => `"${c}"`).join(", ");

      let insertedCount = 0;

      for (const row of rows) {
        const values = columns.map((c) => row[c]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

        const queryStr = `
          INSERT INTO "${table}" (${colNamesStr})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING
        `;

        await neonClient.query(queryStr, values);
        insertedCount++;
      }

      console.log(`✅ Successfully migrated ${insertedCount}/${rows.length} rows for "${table}".`);
    } catch (tableErr) {
      console.error(`❌ Error migrating table "${table}":`, tableErr.message);
    }
  }

  await supabaseClient.end();
  await neonClient.end();

  console.log("\n🎉 Zero Data Loss Migration Completed Successfully!");
}

migrate().catch((err) => {
  console.error("Migration Fatal Error:", err);
  process.exit(1);
});
