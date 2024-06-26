import { OpenAPIHono } from "@hono/zod-openapi";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { unkey, type UnkeyContext } from "@unkey/hono";

import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  updatePost,
} from "../schema/posts";

type Bindings = {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  UNKEY_API_ID: string;
};

const posts = new OpenAPIHono<{
  Variables: { unkey: UnkeyContext };
  Bindings: Bindings;
}>();

posts.use("*", async (c, next) => {
  const handler = unkey({ apiId: c.env.UNKEY_API_ID });
  await handler(c, next);
});
posts.openapi(getPosts, async (c) => {
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json({ error: "authorized", code: 401 }, 401);
  }
  const libsql = createClient({
    url: c.env.TURSO_DATABASE_URL,
    authToken: c.env.TURSO_AUTH_TOKEN,
  });

  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });

  const results = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      post: true,
    },
  });
  if (!results.length) {
    return c.json({ error: "Missing title or post", code: 400 }, 400);
  }
  return c.json({ posts: results, code: 200 }, 200);
});
posts.openapi(createPost, async (c) => {
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json({ error: "authorized", code: 401 }, 401);
  }
  const { title, post }: { title: string; post: string } = await c.req.json();
  if (!title || !post) {
    return c.json({ error: "Missing title or post", code: 400 }, 400);
  }
  const libsql = createClient({
    url: c.env.TURSO_DATABASE_URL,
    authToken: c.env.TURSO_AUTH_TOKEN,
  });

  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });
  const results = await prisma.post.create({
    data: {
      title,
      post,
    },
  });
  if (!results.id) {
    return c.json({ error: "Missing title or post", code: 400 }, 400);
  }
  return c.json({}, 201);
});
posts.openapi(getPost, async (c) => {
  const cache = c.get("cache")
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json({ error: "authorized", code: 401 }, 401);
  }
  const libsql = createClient({
    url: c.env.TURSO_DATABASE_URL,
    authToken: c.env.TURSO_AUTH_TOKEN,
  });
  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });
  const id = c.req.param("id");
  const post = await cache.post.swr(id, async () => {
    const results = await prisma.post.findUnique({
      where: {
        id: Number.parseInt(c.req.param("id")),
      },
    });
    if (!results) {
      return undefined;
    }
    return results;
  });
  if (!post.val) {
    return c.json({ error: "Post not found", code: 400 }, 400);
  }
  return c.json(
    { id: post.val.id, title: post.val.title, post: post.val.post, code: 200 },
    200
  );
});

posts.openapi(updatePost, async (c) => {
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json({ error: "authorized", code: 401 }, 401);
  }
  const postId = Number.parseInt(c.req.param("id"));
  const { title, post } = await c.req.json();
  const libsql = createClient({
    url: c.env.TURSO_DATABASE_URL,
    authToken: c.env.TURSO_AUTH_TOKEN,
  });
  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });
  const results = await prisma.post.update({
    where: {
      id: postId,
    },
    data: {
      title,
      post,
    },
    select: {
      id: true,
      post: true,
      title: true,
    },
  });
  if (results === null || !results.id) {
    return c.json(
      { error: "Post does not exist with this id", code: 400 },
      400
    );
  }
  return c.json(
    { id: results.id, post: results.post, title: results.title, code: 200 },
    200
  );
});

posts.openapi(deletePost, async (c) => {
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json({ error: "Authorized", code: 401 }, 401);
  }
  const postId = Number.parseInt(c.req.param("id"));
  const libsql = createClient({
    url: c.env.TURSO_DATABASE_URL,
    authToken: c.env.TURSO_AUTH_TOKEN,
  });
  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });
  const results = await prisma.post.delete({
    where: {
      id: postId,
    },
  });
  if (results === null || !results.id) {
    return c.json(
      { error: "Post does not exist with this id", code: 400 },
      400
    );
  }
  return c.json({}, 201);
});

export {posts};
