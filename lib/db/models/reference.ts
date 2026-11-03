import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export interface ReferenceDataAttributes {
  key: string;
  payload: unknown;
}

export interface ReferenceDataCreationAttributes extends ReferenceDataAttributes {}

export class ReferenceData
  extends Model<ReferenceDataAttributes, ReferenceDataCreationAttributes>
  implements ReferenceDataAttributes
{
  declare key: string;
  declare payload: unknown;
}

ReferenceData.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'reference_data',
    underscored: true,
    timestamps: false,
  }
);
