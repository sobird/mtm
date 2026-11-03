import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export type AnalysisKey = 'workbench' | 'trending' | 'operation';

export interface AnalysisSnapshotAttributes {
  key: AnalysisKey;
  period: string;
  payload: unknown;
}

export interface AnalysisSnapshotCreationAttributes extends AnalysisSnapshotAttributes {}

export class AnalysisSnapshot
  extends Model<AnalysisSnapshotAttributes, AnalysisSnapshotCreationAttributes>
  implements AnalysisSnapshotAttributes
{
  declare key: AnalysisKey;
  declare period: string;
  declare payload: unknown;
}

AnalysisSnapshot.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    period: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'analysis_snapshot',
    underscored: true,
    timestamps: false,
  }
);
