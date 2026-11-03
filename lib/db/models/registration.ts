import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../connection';

export interface RegistrationAttributes {
  id: number;
  interCode: string;
  mobile: string;
  status: number;
}

export interface RegistrationCreationAttributes extends Omit<RegistrationAttributes, 'id'> {
  id?: number;
}

export class Registration
  extends Model<RegistrationAttributes, RegistrationCreationAttributes>
  implements RegistrationAttributes
{
  declare id: number;
  declare interCode: string;
  declare mobile: string;
  declare status: number;
}

Registration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    interCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'registration',
    underscored: true,
    timestamps: false,
  }
);

export interface InvitationAttributes {
  id: number;
  code: string;
  mobile: string;
  usedAt: Date;
}

export interface InvitationCreationAttributes extends Omit<InvitationAttributes, 'id'> {
  id?: number;
}

export class Invitation
  extends Model<InvitationAttributes, InvitationCreationAttributes>
  implements InvitationAttributes
{
  declare id: number;
  declare code: string;
  declare mobile: string;
  declare usedAt: Date;
}

Invitation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'invitation',
    underscored: true,
    timestamps: false,
  }
);
