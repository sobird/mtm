import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export interface ViolationAttributes {
  id: number;
  issueCount: number;
  appealCount: number;
  ticketAmount: number;
  payload: unknown;
}

export interface ViolationCreationAttributes extends Omit<ViolationAttributes, 'id'> {
  id?: number;
}

export class Violation extends Model<ViolationAttributes, ViolationCreationAttributes> implements ViolationAttributes {
  declare id: number;
  declare issueCount: number;
  declare appealCount: number;
  declare ticketAmount: number;
  declare payload: unknown;
}

Violation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    issueCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    appealCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ticketAmount: {
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
    tableName: 'violation',
    underscored: true,
    timestamps: false,
  }
);
