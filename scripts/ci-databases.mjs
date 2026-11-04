import { SQL } from 'bun';

const BASE = process.env.CI_DATABASE_URL ?? 'postgresql://mtm:mtm@localhost:5432/postgres';
const DATABASES = [
  'commerce_merchant',
  'commerce_ops',
  'commerce_core',
  'commerce_merchant_test',
  'commerce_core_test',
  'commerce_ops_test',
];

const sql = new SQL(BASE);
// Databases are created sequentially on purpose: each CREATE DATABASE runs on
// the maintenance connection, so keep it deterministic instead of racing them.
for (const name of DATABASES) {
  // eslint-disable-next-line no-await-in-loop
  const rows = await sql`SELECT 1 FROM pg_database WHERE datname = ${name}`;
  if (rows.length === 0) {
    // eslint-disable-next-line no-await-in-loop
    await sql.unsafe(`CREATE DATABASE "${name}"`);
    console.log(`created ${name}`);
  }
}
await sql.close();
