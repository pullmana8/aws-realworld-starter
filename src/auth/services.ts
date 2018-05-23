import log from "ts-log-class";
import { inject, injectable } from "inversify";
import * as Util from "../utils";
import * as Models from "./models";
import { IRepo } from "./repos";

export interface IService {
  del(email: string): Promise<string>;
  login(data: Models.IUserAuth | undefined): Promise<Models.IUser>;
  register(model: Models.IUserAuth | undefined): Promise<Models.IUser>;
}

@log()
@injectable()
export class Service implements IService {

  // TODO: Locale :
  protected MISSING_USER_INFO = "Missing user information";
  protected MISSING_SPECIFIC_REG_FIELD = "Email, password, or username was not provided";
  protected MISSING_SPECIFIC_LOGIN_FIELD = "Email or password was not provided";
  protected USER_ALREADY_EXISTS = "The provided email address is already registered";

  constructor(
    @inject(Models.MODULE_TYPES.Repo) private _repo: IRepo
  ) { }

  del(email: string): Promise<string> {
    return this._repo.del(email).then(() => "Success");
  }

  login(data: Models.IUserAuth | undefined): Promise<Models.IUser> {
    if (data === null || data === undefined) {
      throw Util.ErrorGenerators.requestValidation(this.MISSING_USER_INFO);
    }
    if (!data.email || !data.password) {
      throw Util.ErrorGenerators.requestValidation(this.MISSING_SPECIFIC_LOGIN_FIELD);
    }
    return this._repo.login(data);
  }

  register(data: Models.IUserAuth | undefined): Promise<Models.IUser> {
    if (data === null || data === undefined) {
      throw Util.ErrorGenerators.requestValidation(this.MISSING_USER_INFO);
    }
    if (!data.email || !data.password || !data.username) {
      throw Util.ErrorGenerators.requestValidation(this.MISSING_SPECIFIC_REG_FIELD);
    }
    return this._repo.get(data.email)
      .then(() => {
        throw Util.ErrorGenerators.requestValidation(this.USER_ALREADY_EXISTS);
      }).catch(reason => {
        if (reason instanceof Util.Errors.LambdaError) {
          if (reason.type === Util.Errors.NOT_FOUND_ERR.type) {
            return this._repo.register(data as any);
          }
        }
        throw reason;
      });
  }

  // get(id: string): Promise<IUser> {
  //   // Sample throw logic
  //   if (id == "error") {
  //     throw Util.Errors.LambdaError.requestUnauthorizedError("Access Error");
  //   }
  //   return this._repo.get(id);
  // }

  // // list(): Promise<IModel[]> {
  // //     return this._repo.list();
  // // }

  // del(id: string): Promise<void> {
  //   return this._repo.del(id);
  // }

  // put(model: IUser): Promise<IUser> {
  //   this.validate(model);
  //   return this.get(model.id).then(
  //     () => this._repo.put(model)
  //   );
  // }

}
