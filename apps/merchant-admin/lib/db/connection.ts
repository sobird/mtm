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

// Reuse one connection (and one init promise) across module copies. The
// production server can load several bundled copies of this module; without a
// shared cache each copy syncs a different Sequelize instance, so models
// registered by one copy are missing from another and `sync()` silently
// creates only a subset of tables (R-21, seen as `no such table: seed_meta`).
export const dbGlobal: DbGlobalState = (globalForDb.__mtmDb ??= {});

function createSequelize(): Sequelize {
  const storage = getDatabasePath();

  return new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
    // A single connection keeps an in-memory database shared and avoids write
    // contention for this single-instance demo app.
    pool: { max: 1 },
    hooks: {
      // Create the parent directory only when the connection is actually
      // opened. Doing this at import time makes `next build` try to mkdir the
      // production path (`/data`) while collecting page data, which fails on
      // machines without that directory (and in the Docker builder stage).
      beforeConnect() {
        if (storage !== ':memory:') {
          fs.mkdirSync(path.dirname(storage), { recursive: true });
        }
      },
    },
  });
}

export const sequelize = dbGlobal.sequelize ?? createSequelize();

dbGlobal.sequelize = sequelize;
