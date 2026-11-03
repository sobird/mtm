import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export interface MerchantTaskAttributes {
  id: number;
  poiId: number;
  curTaskCount: number;
  curAwardCount: number;
  payload: unknown;
}

export interface MerchantTaskCreationAttributes extends Omit<MerchantTaskAttributes, 'id'> {
  id?: number;
}

export class MerchantTask
  extends Model<MerchantTaskAttributes, MerchantTaskCreationAttributes>
  implements MerchantTaskAttributes
{
  declare id: number;
  declare poiId: number;
  declare curTaskCount: number;
  declare curAwardCount: number;
  declare payload: unknown;
}

MerchantTask.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    poiId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    curTaskCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    curAwardCount: {
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
    tableName: 'merchant_task',
    underscored: true,
    timestamps: false,
  }
);
