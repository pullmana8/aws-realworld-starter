import { injectable, inject } from "inversify";
import log from "ts-log-class";
import * as Utils from "../utils";
import * as Models from "./models";

export interface IRepo {
  del(email: string): Promise<void>;
  get(email: string): Promise<Models.IUser | undefined>;
  put(model: Models.IUser): Promise<Models.IUser>;
}

@log()
@injectable()
export class Repo implements IRepo {

  constructor(
    @inject(Models.MODULE_TYPES.Database) private _table: Utils.Dynamo.IDynamoTable
  ) { }

  del(email: string): Promise<void> {
    return this.get(email)
      .then(_model => {
        // this._table.delete({ id: model.id, createTime: model.createTime }
      });
  }

  get(email: string): Promise<Models.IUser | undefined> {
    return this._table.get('email = :email', { ':email': email })
      .then(items => items.length > 0 ? items[0] : undefined);
  }

  put(model: Models.IUser): Promise<Models.IUser> {
    return this._table.put(model);
  }
}
