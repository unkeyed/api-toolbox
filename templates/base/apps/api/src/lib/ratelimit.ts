import { Ratelimit } from "@unkey/ratelimit";

import type { Middleware } from "./hono";

export function initRatelimiter(): Middleware {
  return async (c, next) => {
    const ratelimit = new Ratelimit({
      rootKey: c.env.UNKEY_ROOT_KEY,
      namespace: "api-toolbox",
      limit: 10,
      duration: "30s",
      async: true,
    });

    c.set("ratelimit", ratelimit);

    return next();
  };
}
