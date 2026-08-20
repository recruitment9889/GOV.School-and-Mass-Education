const { Client } = require("pg");

const neonUrl = "postgresql://neondb_owner:npg_2anKBE6IOkpx@ep-flat-frost-b3otwt6h.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function run() {
  const client = new Client({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("Connected to Neon directly!");
    const res = await client.query('SELECT * FROM "AdminUser"');
    console.log("AdminUser table query result:", res.rows);
  } catch (err) {
    console.error("Direct Neon Error:", err);
  } finally {
    await client.end();
  }
}

run();
