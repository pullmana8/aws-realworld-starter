import { injectable, inject } from "inversify";
import * as crypto from "crypto";
import log from "ts-log-class";
import * as Utils from "../utils";
import * as Models from "./models";

export interface IRepo {
  del(email: string): Promise<void>;
  get(email: string): Promise<Models.IUser | undefined>;
  register(user: Models.IUserRegistration): Promise<Models.IUser>;
  // put(model: Models.IUser): Promise<Models.IUser>;
}

@log()
@injectable()
export class Repo implements IRepo {

  constructor(
    @inject(Models.MODULE_TYPES.Database) private _table: Utils.Dynamo.IDynamoTable
  ) { }

  del(email: string): Promise<void> {
    return this.get(email)
      .then((data: any) => {
        const user = data as Models.IUserStored;
        if (user) {
          this._table.del({ email: user.email, createTime: user.createTime })
            .catch(err => {
              throw Utils.ErrorGenerators.deleteDataFailed({ message: `[Auth.repo]::[del] error - ${err}` });
            });
        }
      });
  }

  get(email: string): Promise<Models.IUser | undefined> {
    return this._table.get('email = :email', { ':email': email })
      .then(items => items.length > 0 ? items[0] : undefined)
      .then(item => cleanPrivateProperties(item));
  }

  register(user: Models.IUserRegistration): Promise<Models.IUser> {
    return _createPasswordHash(user.password, _createSalt()).then(result => {
      const toStore: Models.IUserStored & Models.IUserRegistration = Object.assign(user, result);
      cleanPrivateProperties(toStore, [Models.UserPrivateProperties.password]);
      return this._table.put(toStore)
        .then(stored => cleanPrivateProperties(stored));
    });
  }

  // put(model: Models.IUser): Promise<Models.IUser> {
  //   return this._table.put(model);
  // }
}

function _createSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function _createPasswordHash(password: string, passwordSalt: string): Promise<{ passwordSalt: string, passwordHash: string }> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, passwordSalt, 10000, 512, "sha512", (err, derivedKey) => {
      if (err) {
        reject(Utils.ErrorGenerators.internalError({ message: `[Auth.Service]::[_createPasswordHash] error - ${err}` }));
      } else {
        resolve({ passwordHash: derivedKey.toString("hex"), passwordSalt });
      }
    });
  });
}

/**
 * Don't allow private information, such as the user password, hash, and salt, to leave the repository.
 * Also supports the usecase of deleting the password from the item prior to storing the user information
 * during registration.
 *
 * @param {*} item
 * @returns {*}
 */
function cleanPrivateProperties(item: Models.IUserStored | undefined, toRemove: Models.UserPrivateProperties[] = Models.USER_PRIVATE_PROPERTIES): any {
  if (item) {
    toRemove.forEach(pp => delete (item as any)[pp]);
  }
  return item;
}
