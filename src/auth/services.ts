import log from "ts-log-class";
import { inject, injectable } from "inversify";
import * as Util from "../utils";
import * as Models from "./models";
import { IRepo } from "./repos";

export interface IService {
  register(model: Models.IUserRegistration | undefined): Promise<Models.IUser>;
}

@log()
@injectable()
export class Service implements IService {

  // TODO: Locale :
  protected MISSING_REGISTRATION_INFO = "Missing user registration information";
  protected MISSING_SPECIFIC_REG_FIELD = "Email, password, or username was not provided";
  protected USER_ALREADY_EXISTS = "The provided email address is already registered";

  constructor(
    @inject(Models.MODULE_TYPES.Repo) private _repo: IRepo
  ) { }

  public register(data: Models.IUserRegistration | undefined): Promise<Models.IUser> {
    if (data === null || data === undefined) {
      throw Util.ErrorGenerators.requestValidation(this.MISSING_REGISTRATION_INFO);
    }
    if (!data.email || !data.password || !data.username) {
      throw Util.ErrorGenerators.requestValidation(this.MISSING_SPECIFIC_REG_FIELD);
    }
    return this._repo.get(data.email)
      .then(maybeUser => {
        if (maybeUser) {
          throw Util.ErrorGenerators.requestValidation(this.USER_ALREADY_EXISTS);
        }
        throw Util.Errors.LambdaError.internalError({ message: "[Auth.Service]::[register] error - If a user is not found, an error is thrown, so we should not get here." });
      }).catch(reason => {
        if (reason instanceof Util.Errors.LambdaError) {
          if (reason.type === Util.Errors.NOT_FOUND_ERR.type) {
            return this._repo.register(data as any);
          }
        }
        throw reason;
      });
  }

  // public get(id: string): Promise<IUser> {
  //   // Sample throw logic
  //   if (id == "error") {
  //     throw Util.Errors.LambdaError.requestUnauthorizedError("Access Error");
  //   }
  //   return this._repo.get(id);
  // }

  // // public list(): Promise<IModel[]> {
  // //     return this._repo.list();
  // // }

  // public del(id: string): Promise<void> {
  //   return this._repo.del(id);
  // }

  // public put(model: IUser): Promise<IUser> {
  //   this.validate(model);
  //   return this.get(model.id).then(
  //     () => this._repo.put(model)
  //   );
  // }

}
