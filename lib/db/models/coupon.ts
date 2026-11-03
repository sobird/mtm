import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export interface CouponAttributes {
  id: string;
  name: string;
  displayName: string;
  type: number;
  target: number;
  status: number;
  ctime: number;
  stime: number;
  etime: number;
  price: number;
  discount: number;
  validDays: number;
  validStime: number;
  validEtime: number;
  sendCount: number;
  leftCount: number;
  stock: number;
  limit: number;
  putCrowd: number;
  useCrowd: number;
  position: number;
  ticketType: number;
  rule: unknown;
  putTerm: unknown;
  useTerm: unknown;
  spuList: unknown;
  spuIds: unknown;
  wmPoiIds: unknown;
}

export interface CouponCreationAttributes extends CouponAttributes {}

export class Coupon extends Model<CouponAttributes, CouponCreationAttributes> implements CouponAttributes {
  declare id: string;
  declare name: string;
  declare displayName: string;
  declare type: number;
  declare target: number;
  declare status: number;
  declare ctime: number;
  declare stime: number;
  declare etime: number;
  declare price: number;
  declare discount: number;
  declare validDays: number;
  declare validStime: number;
  declare validEtime: number;
  declare sendCount: number;
  declare leftCount: number;
  declare stock: number;
  declare limit: number;
  declare putCrowd: number;
  declare useCrowd: number;
  declare position: number;
  declare ticketType: number;
  declare rule: unknown;
  declare putTerm: unknown;
  declare useTerm: unknown;
  declare spuList: unknown;
  declare spuIds: unknown;
  declare wmPoiIds: unknown;
}

Coupon.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    target: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ctime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    etime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    discount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    validDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    validStime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    validEtime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sendCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    leftCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    putCrowd: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    useCrowd: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ticketType: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rule: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    putTerm: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    useTerm: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    spuList: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    spuIds: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    wmPoiIds: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'coupon',
    underscored: true,
    timestamps: false,
  }
);
