import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export interface SeedMetaAttributes {
  version: string;
  appliedAt: Date;
}

export class SeedMeta extends Model<SeedMetaAttributes> {}

SeedMeta.init(
  {
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    appliedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'seed_meta',
    timestamps: false,
  }
);
