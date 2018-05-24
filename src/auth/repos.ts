import { injectable, inject } from "inversify";
import * as crypto from "crypto";
import log from "ts-log-class";
import * as jwt from "jsonwebtoken";
import * as Utils from "../utils";
import * as Models from "./models";
import * as Settings from "./settings";

export interface IRepo {
  del(email: string): Promise<void>;
  get(email: string): Promise<Models.IUserProfile>;
  login(user: Models.IUserAuth): Promise<Models.IUserProfile>;
  register(user: Models.IUserAuth): Promise<Models.IUserProfile>;
}

@log()
@injectable()
export class Repo implements IRepo {

  constructor(
    @inject(Models.MODULE_TYPES.Database) private _table: Utils.Dynamo.IDynamoTable,
    @inject(Models.MODULE_TYPES.Settings) private _settings: Settings.ISettings
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

  get(email: string): Promise<Models.IUserProfile> {
    return _internalGet(this._table, email)
      .then(item => cleanPrivateProperties<Models.IUserProfile>(item as Models.IUserStored));
  }

  login(user: Models.IUserAuth): Promise<Models.IUserProfile> {
    return _internalGet(this._table, user.email)
      .then(storedUser => {
        // Not chained since we need access to the stored user in this scope
        return _createPasswordHash(user.password, storedUser.passwordSalt)
          .then(generated => {
            if (generated.passwordHash !== storedUser.passwordHash) {
              throw Utils.ErrorGenerators.requestUnauthorizedError("The username or password is invalid");
            }
            return cleanPrivateProperties<Models.IUserProfile>(storedUser);
          })
          .then(cleaned => assignToken(cleaned, this._settings));
      });
  }

  register(user: Models.IUserAuth): Promise<Models.IUserProfile> {
    return _createPasswordHash(user.password, _createSalt()).then(result => {
      const toStore: Models.IUserStored & Models.IUserAuth & Models.IUserProfile = Object.assign(user, result, {
        bio: null,
        image: null,
        token: null
      });
      cleanPrivateProperties<Models.IUserStored>(toStore, [Models.UserPrivateProperties.password]);
      return this._table.put(toStore)
        .then(stored => cleanPrivateProperties<Models.IUserProfile>(stored))
        .then(cleaned => assignToken(cleaned, this._settings));
    });
  }
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
        reject(Utils.ErrorGenerators.internalError({ message: `[Auth.Repo]::[_createPasswordHash] error - ${err}` }));
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

/**
 * The user exchanges their password for a signed JWT authentication token.
 *
 * @param {Models.IUser} user
 * @param {Settings.ISettings} settings
 * @returns {Promise<string>}
 */
function generateJwt(user: Models.IUser, settings: Settings.ISettings): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      Object.assign({ exp: Math.floor(new Date().getTime() / 1000) + settings.tokenExpiration }, user), settings.tokenSecret,
      (err: Error, encoded: string) => {
        if (err) {
          reject(Utils.ErrorGenerators.internalError({ message: `[Auth.Repo]::[generateJwt] ${err}` }));
        } else {
          resolve(encoded);
        }
      });
  });
}

function assignToken(user: Models.IUserProfile, settings: Settings.ISettings): Promise<Models.IUserProfile> {
  return generateJwt(user, settings).then(token => {
    user.token = token;
    return user;
  });
}
