import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

interface ValidationErrorItem {
  message: string;
}

interface ExtendedError extends Error {
  statusCode?: number;
  errors?: { [key: string]: ValidationErrorItem };
  code?: number;
  keyValue?: { [key: string]: any };
  value?: any;
}

const errorHandlerMiddleware = (
  err: ExtendedError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const defaultError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong, try again later",
  };
  if (err.name === "ValidationError" && err.errors) {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    // defaultError.msg = err.message
    defaultError.msg = Object.values(err.errors)
      .map((item: ValidationErrorItem) => item.message)
      .join(",");
  }
  if (err.code && err.code === 11000 && err.keyValue) {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.msg = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`;
  }
  if (err.name === "CastError") {
    defaultError.statusCode = StatusCodes.NOT_FOUND;
    defaultError.msg = `No item found with id : ${err.value}`;
  }

  res.status(defaultError.statusCode).json({ msg: defaultError.msg });
};

export default errorHandlerMiddleware;
