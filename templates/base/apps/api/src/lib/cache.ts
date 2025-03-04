import { createCache, Namespace, type Cache as C } from "@unkey/cache";
import { MemoryStore } from "@unkey/cache/stores";

import type { Middleware } from "./hono";

type Post = { id: number; title: string; post: string };

export type CacheNamespaces = {
  post: Post;
};

export type Cache = C<CacheNamespaces>;

const persistentMap = new Map();

export function initCache(): Middleware {
  return async (c, next) => {
    const memory = new MemoryStore({ persistentMap: new Map() });

    const cache = createCache<CacheNamespaces>({
      post: new Namespace<Post>(c.executionCtx, {
        stores: [memory],
        fresh: 300_000,
        stale: 900_000,
      }),
    });
    c.set("cache", cache);
    return next();
  };
}
