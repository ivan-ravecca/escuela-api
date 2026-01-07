import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { ZodSchema, ZodError } from "zod";

type ValidationTarget = "body" | "query" | "params";

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Middleware to validate request data using Zod schemas
 * @param schema - Zod schema to validate against req.body
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: formatZodErrors(result.error),
      });
      return;
    }

    req.body = result.data;
    next();
  };
};

/**
 * Middleware to validate multiple request parts (body, query, params)
 * @param options - Object with schemas for body, query, and/or params
 */
export const validateRequest = (options: ValidateOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    if (options.body) {
      const result = options.body.safeParse(req.body);
      if (!result.success) {
        errors.body = formatZodErrors(result.error);
      } else {
        req.body = result.data;
      }
    }

    if (options.query) {
      const result = options.query.safeParse(req.query);
      if (!result.success) {
        errors.query = formatZodErrors(result.error);
      } else {
        req.query = result.data as ParsedQs;
      }
    }

    if (options.params) {
      const result = options.params.safeParse(req.params);
      if (!result.success) {
        errors.params = formatZodErrors(result.error);
      } else {
        req.params = result.data as ParamsDictionary;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
      return;
    }

    next();
  };
};

/**
 * Format Zod errors into a readable array of strings
 */
const formatZodErrors = (error: ZodError): string[] => {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
};
