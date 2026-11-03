import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export interface AccountAttributes {
  id: number;
  login: string;
  mobile: string;
  interCode: string;
  merchantId: number;
}

export interface AccountCreationAttributes extends Omit<AccountAttributes, 'id'> {
  id?: number;
}

export class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  declare id: number;
  declare login: string;
  declare mobile: string;
  declare interCode: string;
  declare merchantId: number;
}

Account.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    login: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    interCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Account',
    tableName: 'account',
    underscored: true,
    timestamps: false,
  }
);
