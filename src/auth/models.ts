export const MODULE_TYPES = {
  Database: Symbol("AuthDatabaseProvider"),
  Repo: Symbol("AuthRepo"),
  Service: Symbol("AuthService")
};

export interface IUser {
  email: string;
  username: string;
}

export interface IUserRegistration extends IUser {
  password: string;
}

export interface IUserProfile extends IUser {
  bio: string;
  image: string;
  token: string;
}

/**
 * Represents the data stored within the database and used internally, but
 * not exposed out of this API.
 *
 * @export
 * @interface IUserStored
 */
export interface IUserStored {
  passwordHash: string;
  passwordSalt: string;
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
