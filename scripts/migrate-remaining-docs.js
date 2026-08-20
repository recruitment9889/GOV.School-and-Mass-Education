const { Client } = require("pg");

const supabaseUrl = process.env.SUPABASE_DIRECT_URL || "postgresql://postgres.wswnolhapvqwdpnfniqp:%40Santosh98210@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres";
const neonUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_SKB1y7ElgiYX@ep-wandering-mud-axn4i9xe-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function run() {
  console.log("Checking Document migration count in new Neon DB...");
  const neon = new Client({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });
  await neon.connect();

  const neonDocRes = await neon.query('SELECT count(*) FROM "Document"');
  console.log(`Current documents in new DB: ${neonDocRes.rows[0].count} / 268`);

  const supabase = new Client({ connectionString: supabaseUrl, ssl: { rejectUnauthorized: false } });
  await supabase.connect();

  const existingIdsRes = await neon.query('SELECT id FROM "Document"');
  const existingIds = new Set(existingIdsRes.rows.map(r => r.id));

  const totalSupabaseRes = await supabase.query('SELECT count(*) FROM "Document"');
  const total = parseInt(totalSupabaseRes.rows[0].count, 10);
  console.log(`Total in Supabase: ${total}`);

  let offset = 0;
  const chunkSize = 10;
  let inserted = 0;

  while (offset < total) {
    const res = await supabase.query(`SELECT * FROM "Document" ORDER BY id LIMIT ${chunkSize} OFFSET ${offset}`);
    for (const doc of res.rows) {
      if (!existingIds.has(doc.id)) {
        await neon.query(
          `INSERT INTO "Document" ("id", "applicationId", "documentType", "fileUrl", "fileSize", "uploadedAt") 
           VALUES ($1, $2, $3, $4, $5, $6) 
           ON CONFLICT DO NOTHING`,
          [doc.id, doc.applicationId, doc.documentType, doc.fileUrl, doc.fileSize, doc.uploadedAt]
        );
        existingIds.add(doc.id);
        inserted++;
      }
    }
    offset += chunkSize;
    console.log(`Progress: checked ${Math.min(offset, total)}/${total} docs (inserted ${inserted} new)`);
  }

  const finalCheck = await neon.query('SELECT count(*) FROM "Document"');
  console.log(`Final documents count in new DB: ${finalCheck.rows[0].count}`);

  await supabase.end();
  await neon.end();
  console.log("Migration complete!");
}

run().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
