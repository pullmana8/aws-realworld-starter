import log from "ts-log-class";
import { inject, injectable } from "inversify";
import * as Util from "../utils";
import * as Models from "./models";
import { IRepo } from "./repos";

export interface IService {
  del(email: string): Promise<string>;
  getUserByToken(token: string | undefined): Promise<Models.IUserProfileBody>;
  login(data: Models.IUserAuthBody | undefined): Promise<Models.IUserProfileBody>;
  register(model: Models.IUserAuthBody | undefined): Promise<Models.IUserProfileBody>;
  update(token: string | undefined, model: Models.IUserProfileBody | undefined): Promise<Models.IUserProfileBody>;
}

@log()
@injectable()
export class Service implements IService {

  // TODO: Locale :
  protected EMAIL_CONFLICT = "The email address is registered to another user";
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

  getUserByToken(token: string | undefined): Promise<Models.IUserProfileBody> {
    if (token === undefined) {
      throw Util.ErrorGenerators.requestUnauthorizedError(this.USER_NOT_LOGGED_IN);
    }
    // Strip off the leading Authorization header prefix
    token = token.replace(/^Token /, "");
    return this._repo.getUserByToken(token).then(profile => {
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
    return this._verifyEmailNotRegistered(data.user.email, this.USER_ALREADY_EXISTS, undefined)
      .then(() => this._repo.register(data.user))
      .then(profile => {
        return {
          user: profile
        };
      });
  }

  update(token: string | undefined, data: Models.IUserProfileBody | undefined): Promise<Models.IUserProfileBody> {
    if (data === null || data === undefined || !data.user) {
      throw Util.ErrorGenerators.requestValidation(this.MISSING_USER_INFO);
    }
    const update = data.user;
    return this.getUserByToken(token)
      .then(body => {
        const current = body.user;
        if (update.email && update.email !== current.email) {
          return this._verifyEmailNotRegistered(update.email, this.EMAIL_CONFLICT, body);
        } else {
          return body;
        }
      })
      .then(body => this._repo.update(body.user, update))
      .then(profile => {
        return {
          user: profile
        };
      });
  }

  private _verifyEmailNotRegistered<T>(email: string, userFoundMessage: string, passThrough: T): Promise<T> {
    return this._repo.get(email)
      .then(() => {
        throw Util.ErrorGenerators.requestValidation(userFoundMessage);
      }).catch(reason => {
        if (reason instanceof Util.Errors.LambdaError) {
          if (reason.type === Util.Errors.NOT_FOUND_ERR.type) {
            return passThrough;
          }
        }
        throw reason;
      });
  }
}
