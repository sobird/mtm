import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export interface MerchantAttributes {
  id: number;
  name: string;
  status: number;
  type: number;
  payload: unknown;
}

export interface MerchantCreationAttributes extends Omit<MerchantAttributes, 'id'> {
  id?: number;
}

export class Merchant extends Model<MerchantAttributes, MerchantCreationAttributes> implements MerchantAttributes {
  declare id: number;
  declare name: string;
  declare status: number;
  declare type: number;
  declare payload: unknown;
}

Merchant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
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
    tableName: 'merchant',
    underscored: true,
    timestamps: false,
  }
);

export interface MerchantCategoryAttributes {
  id: number;
  parentId: number;
  name: string;
  level: number;
}

export interface MerchantCategoryCreationAttributes extends Omit<MerchantCategoryAttributes, 'id'> {
  id?: number;
}

export class MerchantCategory
  extends Model<MerchantCategoryAttributes, MerchantCategoryCreationAttributes>
  implements MerchantCategoryAttributes
{
  declare id: number;
  declare parentId: number;
  declare name: string;
  declare level: number;
}

MerchantCategory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'merchant_category',
    underscored: true,
    timestamps: false,
  }
);

export interface MerchantLicenseAttributes {
  id: number;
  merchantId: number;
  type: number;
  name: string;
  url: string;
  status: number;
  expireAt: string;
}

export interface MerchantLicenseCreationAttributes extends Omit<MerchantLicenseAttributes, 'id'> {
  id?: number;
}

export class MerchantLicense
  extends Model<MerchantLicenseAttributes, MerchantLicenseCreationAttributes>
  implements MerchantLicenseAttributes
{
  declare id: number;
  declare merchantId: number;
  declare type: number;
  declare name: string;
  declare url: string;
  declare status: number;
  declare expireAt: string;
}

MerchantLicense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    expireAt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'merchant_license',
    underscored: true,
    timestamps: false,
  }
);

export interface MerchantEntryAttributes {
  id: number;
  merchantId: number;
  step: number;
  status: number;
  payload: unknown;
}

export interface MerchantEntryCreationAttributes extends Omit<MerchantEntryAttributes, 'id' | 'step' | 'status'> {
  id?: number;
  step?: number;
  status?: number;
}

export class MerchantEntry
  extends Model<MerchantEntryAttributes, MerchantEntryCreationAttributes>
  implements MerchantEntryAttributes
{
  declare id: number;
  declare merchantId: number;
  declare step: number;
  declare status: number;
  declare payload: unknown;
}

MerchantEntry.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    step: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'merchant_entry',
    underscored: true,
    timestamps: false,
  }
);

export interface EntryTaskAttributes {
  id: number;
  merchantId: number;
  bizType: number;
  localCommerce: number;
  status: number;
}

export interface EntryTaskCreationAttributes extends Omit<EntryTaskAttributes, 'id'> {
  id?: number;
}

export class EntryTask extends Model<EntryTaskAttributes, EntryTaskCreationAttributes> implements EntryTaskAttributes {
  declare id: number;
  declare merchantId: number;
  declare bizType: number;
  declare localCommerce: number;
  declare status: number;
}

EntryTask.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bizType: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    localCommerce: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'entry_task',
    underscored: true,
    timestamps: false,
  }
);

export interface EntryTypeAttributes {
  code: string;
  name: string;
  templateUrl: string;
  payload: unknown;
}

export interface EntryTypeCreationAttributes extends EntryTypeAttributes {}

export class EntryType extends Model<EntryTypeAttributes, EntryTypeCreationAttributes> implements EntryTypeAttributes {
  declare code: string;
  declare name: string;
  declare templateUrl: string;
  declare payload: unknown;
}

EntryType.init(
  {
    code: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    templateUrl: {
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
    tableName: 'entry_type',
    underscored: true,
    timestamps: false,
  }
);
