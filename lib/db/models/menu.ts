import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export interface MenuItemAttributes {
  id: string;
  parentId: string;
  title: string;
  icon: string;
  url: string;
  code: string;
  auth: boolean;
  index: string;
  level: number;
  sortId: number;
  toolMenu: boolean;
}

export interface MenuItemCreationAttributes extends MenuItemAttributes {}

export class MenuItem extends Model<MenuItemAttributes, MenuItemCreationAttributes> implements MenuItemAttributes {
  declare id: string;
  declare parentId: string;
  declare title: string;
  declare icon: string;
  declare url: string;
  declare code: string;
  declare auth: boolean;
  declare index: string;
  declare level: number;
  declare sortId: number;
  declare toolMenu: boolean;
}

MenuItem.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    parentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    auth: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    index: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sortId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    toolMenu: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'menu_item',
    underscored: true,
    timestamps: false,
  }
);

export interface MenuBadgeAttributes {
  menuId: string;
  actionType: number;
  noticeStyle: number;
  noticeContent: string;
}

export interface MenuBadgeCreationAttributes extends MenuBadgeAttributes {}

export class MenuBadge extends Model<MenuBadgeAttributes, MenuBadgeCreationAttributes> implements MenuBadgeAttributes {
  declare menuId: string;
  declare actionType: number;
  declare noticeStyle: number;
  declare noticeContent: string;
}

MenuBadge.init(
  {
    menuId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    actionType: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    noticeStyle: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    noticeContent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'menu_badge',
    underscored: true,
    timestamps: false,
  }
);

export interface MenuPreferenceAttributes {
  accountId: number;
  menuId: string;
  visible: boolean;
  sortIndex: number;
}

export interface MenuPreferenceCreationAttributes extends MenuPreferenceAttributes {}

export class MenuPreference
  extends Model<MenuPreferenceAttributes, MenuPreferenceCreationAttributes>
  implements MenuPreferenceAttributes
{
  declare accountId: number;
  declare menuId: string;
  declare visible: boolean;
  declare sortIndex: number;
}

MenuPreference.init(
  {
    accountId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    menuId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    visible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sortIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'menu_preference',
    underscored: true,
    timestamps: false,
  }
);

export interface MenuFavoriteAttributes {
  accountId: number;
  menuId: string;
  sortIndex: number;
}

export interface MenuFavoriteCreationAttributes extends MenuFavoriteAttributes {}

export class MenuFavorite
  extends Model<MenuFavoriteAttributes, MenuFavoriteCreationAttributes>
  implements MenuFavoriteAttributes
{
  declare accountId: number;
  declare menuId: string;
  declare sortIndex: number;
}

MenuFavorite.init(
  {
    accountId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    menuId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    sortIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'menu_favorite',
    underscored: true,
    timestamps: false,
  }
);
