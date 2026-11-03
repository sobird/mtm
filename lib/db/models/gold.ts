import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export interface GoldPeriodAttributes {
  id: number;
  lastPeriodStatus: number;
  currentPeriodSTime: string;
  currentPeriodETime: string;
  payload: unknown;
}

export interface GoldPeriodCreationAttributes extends Omit<GoldPeriodAttributes, 'id'> {
  id?: number;
}

export class GoldPeriod
  extends Model<GoldPeriodAttributes, GoldPeriodCreationAttributes>
  implements GoldPeriodAttributes
{
  declare id: number;
  declare lastPeriodStatus: number;
  declare currentPeriodSTime: string;
  declare currentPeriodETime: string;
  declare payload: unknown;
}

GoldPeriod.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lastPeriodStatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentPeriodSTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currentPeriodETime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'GoldPeriod',
    tableName: 'gold_period',
    underscored: true,
    timestamps: false,
  }
);

export interface GoldStandardAttributes {
  key: string;
  periodId: number;
  name: string;
  desc: string;
  progress: string;
  url: string;
  qualified: number;
  payload: unknown;
}

export interface GoldStandardCreationAttributes extends GoldStandardAttributes {}

export class GoldStandard
  extends Model<GoldStandardAttributes, GoldStandardCreationAttributes>
  implements GoldStandardAttributes
{
  declare key: string;
  declare periodId: number;
  declare name: string;
  declare desc: string;
  declare progress: string;
  declare url: string;
  declare qualified: number;
  declare payload: unknown;
}

GoldStandard.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    periodId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    desc: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    progress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    qualified: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'GoldStandard',
    tableName: 'gold_standard',
    underscored: true,
    timestamps: false,
  }
);
