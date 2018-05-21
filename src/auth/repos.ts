import { injectable, inject } from "inversify";
import * as crypto from "crypto";
import log from "ts-log-class";
import * as Utils from "../utils";
import * as Models from "./models";

export interface IRepo {
  del(email: string): Promise<void>;
  get(email: string): Promise<Models.IUser>;
  login(user: Models.IUserAuth): Promise<Models.IUser>;
  register(user: Models.IUserAuth): Promise<Models.IUser>;
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

  get(email: string): Promise<Models.IUser> {
    return _internalGet(this._table, email)
      .then(item => cleanPrivateProperties<Models.IUser>(item as Models.IUserStored));
  }

  login(user: Models.IUserAuth): Promise<Models.IUser> {
    return _internalGet(this._table, user.email)
      .then(storedUser => {
        return _createPasswordHash(user.password, storedUser.passwordSalt)
          .then(generated => {
            if (generated.passwordHash !== storedUser.passwordHash) {
              throw Utils.ErrorGenerators.requestUnauthorizedError("The username or password is invalid");
            }
            return cleanPrivateProperties<Models.IUser>(storedUser);
          });
      });
  }

  register(user: Models.IUserAuth): Promise<Models.IUser> {
    return _createPasswordHash(user.password, _createSalt()).then(result => {
      const toStore: Models.IUserStored & Models.IUserAuth = Object.assign(user, result);
      cleanPrivateProperties<Models.IUserStored>(toStore, [Models.UserPrivateProperties.password]);
      return this._table.put(toStore)
        .then(stored => cleanPrivateProperties<Models.IUser>(stored));
    });
  }

  // put(model: Models.IUser): Promise<Models.IUser> {
  //   return this._table.put(model);
  // }
}

function _internalGet(table: Utils.Dynamo.IDynamoTable, email: string): Promise<Models.IUserStored> {
  return table.get('email = :email', { ':email': email })
    .then(items => {
      try {
        return items[0];
      } catch (err) {
        throw Utils.ErrorGenerators.internalError({ message: `[Auth.Repo]::[_internalGet] Assumption of not found errors being rejected is no longer true: ${err}` });
      }
    });
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
function cleanPrivateProperties<T>(item: Models.IUserStored, toRemove: Models.UserPrivateProperties[] = Models.USER_PRIVATE_PROPERTIES): T {
  toRemove.forEach(pp => delete (item as any)[pp]);
  return item as any;
}
