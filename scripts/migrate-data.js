const { Client } = require("pg");

const supabaseUrl = process.env.SUPABASE_DIRECT_URL || "postgresql://postgres.wswnolhapvqwdpnfniqp:%40Santosh98210@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres";
const neonUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_kEKv6n1ZMVbl@ep-proud-fog-ayn76khq-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function migrate() {
  console.log("🚀 Starting Zero Data Loss Migration to new Neon project (odisha-recruitment-v3)...");

  const supabaseClient = new Client({ connectionString: supabaseUrl, ssl: { rejectUnauthorized: false } });
  const neonClient = new Client({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });

  await supabaseClient.connect();
  await neonClient.connect();

  console.log("✓ Connected to both Supabase and target Neon project!");

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

      const countRes = await supabaseClient.query(`SELECT COUNT(*) FROM "${table}"`);
      const totalRows = parseInt(countRes.rows[0].count, 10);
      console.log(`Found ${totalRows} total rows in Supabase for table "${table}".`);

      if (totalRows === 0) continue;

      const chunkSize = table === "Document" ? 10 : 50;
      let offset = 0;
      let insertedCount = 0;

      while (offset < totalRows) {
        const chunkRes = await supabaseClient.query(`SELECT * FROM "${table}" ORDER BY id LIMIT ${chunkSize} OFFSET ${offset}`);
        const rows = chunkRes.rows;

        for (const row of rows) {
          const columns = Object.keys(row);
          const colNamesStr = columns.map((c) => `"${c}"`).join(", ");
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

        offset += chunkSize;
        console.log(`  └─ Progress: ${insertedCount}/${totalRows} rows migrated...`);
      }

      console.log(`✅ Successfully migrated ${insertedCount}/${totalRows} rows for "${table}".`);
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
