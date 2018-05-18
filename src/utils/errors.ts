// https://github.com/gothinkster/realworld/tree/master/api#errors-and-status-codes

export const REQUEST_VALIDATION_ERR = {
  code: 422,
  type: 'requestValidationError'
};

export const REQUEST_UNAUTHORIZED_ERR = {
  code: 401,
  type: 'requestUnauthorizedError'
};

export const REQUEST_FORBIDDEN_ERR = {
  code: 403,
  type: 'requestForbiddenError'
};

export const NOT_FOUND_ERR = {
  code: 404,
  type: 'notFound'
};

export enum INTERNAL_ERR_TYPES {
  deleteFailed = 'deleteFailed',
  internalError = 'internalError',
  putFailed = 'putFailed'
}

export const INTERNAL_ERR = {
  code: 500,
  type: INTERNAL_ERR_TYPES,
  message: 'An internal error occurred'
};

export interface ILambdaError {
  errors: { body: string[]; };
  statusCode: number;
  type: string;

  toLambda(): {
    statusCode: number;
    body: string;
  };
}

export class LambdaError implements ILambdaError {
  errors: { body: string[] } = {
    body: []
  };

  constructor(public statusCode: number, public type: string, ...messages: string[]) {
    this.errors.body = messages;
  }

  static requestValidationError(...messages: string[]): ILambdaError {
    return new LambdaError(REQUEST_VALIDATION_ERR.code, REQUEST_VALIDATION_ERR.type, ...messages);
  }

  static requestUnauthorizedError(...messages: string[]): ILambdaError {
    return new LambdaError(REQUEST_UNAUTHORIZED_ERR.code, REQUEST_UNAUTHORIZED_ERR.type, ...messages);
  }

  static requestForbiddenError(...messages: string[]): ILambdaError {
    return new LambdaError(REQUEST_FORBIDDEN_ERR.code, REQUEST_FORBIDDEN_ERR.type, ...messages);
  }

  static notFound(obj: string): ILambdaError {
    return new LambdaError(NOT_FOUND_ERR.code, NOT_FOUND_ERR.type, `The resource \`${obj}\` cannot be found`);
  }

  static internalError(err: { message: string }): ILambdaError {
    return new LambdaError(INTERNAL_ERR.code, INTERNAL_ERR.type.internalError, err.message);
  }

  static putDataFailed(err: { message: string }): ILambdaError {
    return new LambdaError(INTERNAL_ERR.code, INTERNAL_ERR.type.putFailed, err.message);
  }

  static deleteDataFailed(err: { message: string }): ILambdaError {
    return new LambdaError(INTERNAL_ERR.code, INTERNAL_ERR.type.deleteFailed, err.message);
  }

  toLambda() {
    return {
      statusCode: this.statusCode,
      body: JSON.stringify({
        errors: this.errors,
        type: this.type
      })
    };
  }
}
