import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export interface CampaignAttributes {
  id: string;
  name: string;
  type: number;
  startTime: string;
  endTime: string;
  applyStartTime: string;
  applyEndTime: string;
  startTimeStr: string;
  endTimeStr: string;
  applyStartTimeStr: string;
  applyEndTimeStr: string;
  applyStatus: number;
  applySpuCount: number | null;
  applySkuCount: number | null;
  minStock: string | null;
  maxStock: string | null;
  cover: string | null;
  canClickApply: boolean | null;
  payload: unknown;
}

export interface CampaignCreationAttributes extends CampaignAttributes {}

export class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
  declare id: string;
  declare name: string;
  declare type: number;
  declare startTime: string;
  declare endTime: string;
  declare applyStartTime: string;
  declare applyEndTime: string;
  declare startTimeStr: string;
  declare endTimeStr: string;
  declare applyStartTimeStr: string;
  declare applyEndTimeStr: string;
  declare applyStatus: number;
  declare applySpuCount: number | null;
  declare applySkuCount: number | null;
  declare minStock: string | null;
  declare maxStock: string | null;
  declare cover: string | null;
  declare canClickApply: boolean | null;
  declare payload: unknown;
}

Campaign.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    applyStartTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    applyEndTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    startTimeStr: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    endTimeStr: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    applyStartTimeStr: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    applyEndTimeStr: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    applyStatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    applySpuCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    applySkuCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    minStock: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maxStock: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cover: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    canClickApply: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'campaign',
    underscored: true,
    timestamps: false,
  }
);
