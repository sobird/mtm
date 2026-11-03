import { dbGlobal, sequelize } from './connection';
// Importing the registry registers every model before `sync()` runs.
import { SeedMeta } from './models';
import { seedDatabase } from './seed';

let initPromise: Promise<void> | null = dbGlobal.initPromise ?? null;

async function bootstrap(): Promise<void> {
  await sequelize.sync();

  await SeedMeta.findOrCreate({
    where: { version: 'bootstrap' },
    defaults: { version: 'bootstrap', appliedAt: new Date() },
  });

  await seedDatabase();
}

export function initDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = bootstrap().catch(error => {
      // Allow a later call to retry after a failed initialization.
      initPromise = null;
      dbGlobal.initPromise = null;
      throw error;
    });
    dbGlobal.initPromise = initPromise;
  }

  return initPromise;
}

export { sequelize };
