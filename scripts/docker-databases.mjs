// Ensures the three business databases exist before Prisma migrations run.
// `deploy/postgres/init.sql` only executes on a fresh volume, so a reused
// `mtm-postgres` volume has no `commerce_*` databases and `migrate` would fail
// with P1003. This runs in the migrate service against the maintenance database.
import { SQL } from 'bun';

const source = process.env.MERCHANT_DATABASE_URL;

if (!source) {
  console.error('MERCHANT_DATABASE_URL is required to create the business databases.');
  process.exit(1);
}

const maintenanceUrl = new URL(source);
maintenanceUrl.pathname = '/postgres';
maintenanceUrl.search = '';

const DATABASES = ['commerce_merchant', 'commerce_core', 'commerce_ops'];

const sql = new SQL(maintenanceUrl.href);
try {
  for (const name of DATABASES) {
    // Databases are created sequentially: CREATE DATABASE runs on the
    // maintenance connection, so keep it deterministic instead of racing.
    // eslint-disable-next-line no-await-in-loop
    const rows = await sql`SELECT 1 FROM pg_database WHERE datname = ${name}`;
    if (rows.length === 0) {
      // eslint-disable-next-line no-await-in-loop
      await sql.unsafe(`CREATE DATABASE "${name}"`);
      console.log(`created ${name}`);
    }
  }
} finally {
  await sql.close();
}
