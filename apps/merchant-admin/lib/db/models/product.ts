import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export interface ProductAttributes {
  id: number;
  poiId: number;
  payload: unknown;
}

export interface ProductCreationAttributes extends Omit<ProductAttributes, 'id'> {
  id?: number;
}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare id: number;
  declare poiId: number;
  declare payload: unknown;
}

Product.init(
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
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'product',
    underscored: true,
    timestamps: false,
  }
);
