import fs from 'node:fs';
import path from 'node:path';

import { Sequelize } from 'sequelize';

import { getDatabasePath } from './config';

export type DbGlobalState = {
  sequelize?: Sequelize;
  initPromise?: Promise<void> | null;
};

const globalForDb = globalThis as typeof globalThis & {
  __mtmDb?: DbGlobalState;
};

const isProduction = process.env.NODE_ENV === 'production';

// Reuse the same connection across HMR reloads in development. In production a
// module-level instance is enough, so the global cache is not used.
export const dbGlobal: DbGlobalState = isProduction ? {} : (globalForDb.__mtmDb ??= {});

function createSequelize(): Sequelize {
  const storage = getDatabasePath();

  if (storage !== ':memory:') {
    fs.mkdirSync(path.dirname(storage), { recursive: true });
  }

  return new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
    // A single connection keeps an in-memory database shared and avoids write
    // contention for this single-instance demo app.
    pool: { max: 1 },
  });
}

export const sequelize = dbGlobal.sequelize ?? createSequelize();

dbGlobal.sequelize = sequelize;
