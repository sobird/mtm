import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export type MessageKind = 'news' | 'detail';

export interface MessageAttributes {
  kind: MessageKind;
  id: string;
  title: string;
  type: number;
  content: string | null;
  createTime: number | null;
  publishTime: number | null;
  duration: number | null;
  noticeStyle: number | null;
  notifyEnable: boolean | null;
  actionList: unknown;
  payload: unknown;
}

export interface MessageCreationAttributes extends MessageAttributes {}

export class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  declare kind: MessageKind;
  declare id: string;
  declare title: string;
  declare type: number;
  declare content: string | null;
  declare createTime: number | null;
  declare publishTime: number | null;
  declare duration: number | null;
  declare noticeStyle: number | null;
  declare notifyEnable: boolean | null;
  declare actionList: unknown;
  declare payload: unknown;
}

Message.init(
  {
    kind: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    publishTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    noticeStyle: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notifyEnable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    actionList: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'message',
    underscored: true,
    timestamps: false,
  }
);
