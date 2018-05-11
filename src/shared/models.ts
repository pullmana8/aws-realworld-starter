export const MODULE_TYPES = {
  IAppSettings: Symbol("ISharedSettings")
};

export interface ISettings {
  example: string;
}

export class Settings implements ISettings {
  constructor(public example: string) { }
}
