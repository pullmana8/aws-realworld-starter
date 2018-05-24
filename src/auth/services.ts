import log from "ts-log-class";
import { inject, injectable } from "inversify";
import * as Util from "../utils";
import * as Models from "./models";
import { IRepo } from "./repos";

export interface IService {
  del(email: string): Promise<string>;
  getCurrentUser(token: string | undefined): Promise<Models.IUserProfileBody>;
  login(data: Models.IUserAuthBody | undefined): Promise<Models.IUserProfileBody>;
  register(model: Models.IUserAuthBody | undefined): Promise<Models.IUserProfileBody>;
}

@log()
@injectable()
export class Service implements IService {

  // TODO: Locale :
  protected MISSING_USER_INFO = "Missing user information";
  protected MISSING_SPECIFIC_REG_FIELD = "Email, password, or username was not provided";
  protected MISSING_SPECIFIC_LOGIN_FIELD = "Email or password was not provided";
  protected USER_ALREADY_EXISTS = "The provided email address is already registered";
  protected USER_NOT_LOGGED_IN = "The user is not logged in.";

  constructor(
    @inject(Models.MODULE_TYPES.Repo) private _repo: IRepo
  ) { }

  del(email: string): Promise<string> {
    return this._repo.del(email).then(() => "Success");
  }

  getCurrentUser(token: string | undefined): Promise<Models.IUserProfileBody> {
    if (token === undefined) {
      throw Util.ErrorGenerators.requestUnauthorizedError(this.USER_NOT_LOGGED_IN);
    }
    // Strip off the leading Authorization header prefix
    token = token.replace(/^Token /, "");
    return this._repo.getCurrentUser(token).then(profile => {
      return {
        user: profile
      };
    });
  }

  login(data: Models.IUserAuthBody | undefined): Promise<Models.IUserProfileBody> {
    if (data === null || data === undefined || !data.user) {
      throw Util.ErrorGenerators.requestValidation(this.MISSING_USER_INFO);
    }
    if (!data.user.email || !data.user.password) {
      throw Util.ErrorGenerators.requestValidation(this.MISSING_SPECIFIC_LOGIN_FIELD);
    }

    // Get will throw a 404 if the email is not registered in the system.
    return this._repo.login(data.user)
      .then(profile => {
        return {
          user: profile
        };
      });
  }

  register(data: Models.IUserAuthBody | undefined): Promise<Models.IUserProfileBody> {
    if (data === null || data === undefined || !data.user) {
      throw Util.ErrorGenerators.requestValidation(this.MISSING_USER_INFO);
    }
    if (!data.user.email || !data.user.password || !data.user.username) {
      throw Util.ErrorGenerators.requestValidation(this.MISSING_SPECIFIC_REG_FIELD);
    }
    return this._repo.get(data.user.email)
      .then(() => {
        throw Util.ErrorGenerators.requestValidation(this.USER_ALREADY_EXISTS);
      }).catch(reason => {
        if (reason instanceof Util.Errors.LambdaError) {
          if (reason.type === Util.Errors.NOT_FOUND_ERR.type) {
            return this._repo.register(data.user)
              .then(profile => {
                return {
                  user: profile
                };
              });
          }
        }
        throw reason;
      });
  }
}
