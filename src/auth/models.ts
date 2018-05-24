import { APIGatewayEvent } from "aws-lambda";

export const MODULE_TYPES = {
  Database: Symbol("AuthDatabaseProvider"),
  Repo: Symbol("AuthRepo"),
  Service: Symbol("AuthService"),
  Settings: Symbol("AuthSettings")
};

export interface IDeleteUserRequest extends APIGatewayEvent {
  pathParameters: {
    email: string;
  };
}

export interface IUser {
  createTime?: number;
  email: string;
  username: string;
}

export interface IUserAuth extends IUser {
  password: string;
}

export interface IUserAuthBody {
  user: IUserAuth;
}

export interface IUserProfile extends IUser {
  bio: string | null;
  image: string | null;
  token: string | null;
}

export interface IUserProfileBody {
  user: IUserProfile;
}

/**
 * Represents the data stored within the database and used internally, but
 * not exposed out of this API.
 *
 * @export
 * @interface IUserStored
 */
export interface IUserStored extends IUser {
  passwordHash: string;
  passwordSalt: string;
  createTime?: number;
  updateTime?: number;
}

export enum UserPrivateProperties {
  password = "password",
  passwordHash = "passwordHash",
  passwordSalt = "passwordSalt"
}

export const USER_PRIVATE_PROPERTIES = [
  UserPrivateProperties.password,
  UserPrivateProperties.passwordHash,
  UserPrivateProperties.passwordSalt
];
