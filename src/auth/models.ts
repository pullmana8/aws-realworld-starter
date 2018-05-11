export const MODULE_TYPES = {
  Database: Symbol("AuthDatabaseProvider"),
  Repo: Symbol("AuthRepo"),
  Service: Symbol("AuthService")
};

export interface IUserRegistration {
  email: string;
  password: string;
  username: string;
}

export interface IUser {
  bio: string;
  email: string;
  image: string;
  token: string;
  username: string;
}
