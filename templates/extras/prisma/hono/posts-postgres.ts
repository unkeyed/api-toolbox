import { OpenAPIHono } from "@hono/zod-openapi";
import { unkey, type UnkeyContext } from "@unkey/hono";

import { connectDatabase } from "../database";
import type { Cache } from "../lib/cache";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  updatePost,
} from "../schema/posts";

type Bindings = {
  DATABASE_URL: string;
  UNKEY_API_ID: string;
};

const posts = new OpenAPIHono<{
  Variables: { unkey: UnkeyContext; cache: Cache };
  Bindings: Bindings;
}>();

posts.use("*", async (c, next) => {
  const handler = unkey({ apiId: c.env.UNKEY_API_ID });
  await handler(c, next);
});
posts.openapi(getPosts, async (c) => {
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json(
      {
        message: "unauthorized",
        docs: "https://localhost:3000/docs/api-reference/",
      },
      401
    );
  }
  const prisma = connectDatabase(c);

  const results = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      post: true,
    },
  });
  if (!results.length) {
    return c.json(
      {
        message: "Error retrieving posts from database",
        docs: "https://localhost:3000/docs/api-reference/",
      },
      400
    );
  }
  return c.json({ posts: results, code: 200 }, 200);
});
posts.openapi(createPost, async (c) => {
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json(
      {
        message: "unauthorized",
        docs: "https://localhost:3000/docs/api-reference/",
      },
      401
    );
  }
  const { title, post }: { title: string; post: string } = await c.req.json();
  if (!title || !post) {
    return c.json(
      {
        message: "Missing title or post, please verify your request body",
        docs: "https://localhost:3000/docs/api-reference/",
      },
      400
    );
  }
  const prisma = connectDatabase(c);
  const results = await prisma.post.create({
    data: {
      title,
      post,
    },
  });
  if (!results.id) {
    return c.json(
      {
        message: "Error creating post, please try again later.",
        docs: "https://localhost:3000/docs/api-reference/create",
      },
      400
    );
  }
  return c.json({}, 201);
});
posts.openapi(getPost, async (c) => {
  const cache = c.get("cache");
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json(
      {
        message: "unauthorized",
        docs: "https://localhost:3000/docs/api-reference/",
      },
      401
    );
  }
  const prisma = connectDatabase(c);
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
    return c.json(
      {
        message: `Post does not exist with this id: ${id}`,
        docs: "https://localhost:3000/docs/api-reference/get",
      },
      404
    );
  }
  return c.json(
    { id: post.val.id, title: post.val.title, post: post.val.post, code: 200 },
    200
  );
});

posts.openapi(updatePost, async (c) => {
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json(
      {
        message: "unauthorized",
        docs: "https://localhost:3000/docs/api-reference/",
      },
      401
    );
  }
  const postId = Number.parseInt(c.req.param("id"));
  const { title, post } = await c.req.json();
  const prisma = connectDatabase(c);
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
    c.json(
      {
        message: "Post does not exist with this id",
        docs: "https://localhost:3000/api-reference/get",
      },
      404
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
    return c.json(
      {
        message: "unauthorized",
        docs: "https://localhost:3000/docs/api-reference/",
      },
      401
    );
  }
  const postId = Number.parseInt(c.req.param("id"));
  const prisma = connectDatabase(c);
  const results = await prisma.post.delete({
    where: {
      id: postId,
    },
  });
  if (results === null || !results.id) {
    return c.json(
      {
        message: `Post does not exist with this id: ${postId}`,
        docs: "https://localhost:3000/docs/api-reference",
      },
      404
    );
  }
  return c.json({}, 201);
});

export { posts };
