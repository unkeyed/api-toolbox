import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { UnkeyContext } from "@unkey/hono";
import type { Ratelimit } from "@unkey/ratelimit";
import type { Context as GenericContext, MiddlewareHandler } from "hono";
import type { ZodError } from "zod";

import type { Cache } from "./cache";

export type HonoEnv = {
  Bindings: {
    UNKEY_ROOT_KEY: string;
    UNKEY_API_ID: string;
  };
  Variables: {
    cache: Cache;
    unkey: UnkeyContext;
    ratelimit: Ratelimit;
  };
};

export function parseZodErrorMessage(err: z.ZodError): string {
  try {
    const arr = JSON.parse(err.message) as Array<{
      message: string;
      path: Array<string>;
    }>;
    const { path, message } = arr[0];
    return `${path.join(".")}: ${message}`;
  } catch {
    return err.message;
  }
}
export function handleZodError(
  result:
    | {
        success: true;
        data: any;
      }
    | {
        success: false;
        error: ZodError;
      },
  c: Context
) {
  if (!result.success) {
    return c.json(
      {
        error: parseZodErrorMessage(result.error),
      },
      { status: 400 }
    );
  }
}

export function newApp() {
  const app = new OpenAPIHono<HonoEnv>({
    defaultHook: handleZodError,
  });

  app.onError((err: Error, c: Context) => {
    console.error(err);
    return c.json(
      {
        error: err.message,
      },
      { status: 500 }
    );
  });

  app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
    },
  });

  app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    bearerFormat: "Bearer",
    type: "http",
    scheme: "bearer",
  });

  return app;
}

export type App = ReturnType<typeof newApp>;
export type Context = GenericContext<HonoEnv>;
export type Middleware = MiddlewareHandler<HonoEnv>;
