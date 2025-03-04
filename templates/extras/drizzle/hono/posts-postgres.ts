import { OpenAPIHono } from "@hono/zod-openapi";
import { unkey, type UnkeyContext } from "@unkey/hono";
import { eq } from "drizzle-orm";

import { connectDatabase } from "../database";
import { posts as postsTable } from "../db/postgres";
import { Cache } from "../lib/cache";
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
        docs: "http://localhost:3000/docs/api-reference/",
      },
      401
    );
  }

  const db = connectDatabase(c);
  const results = await db.query.posts.findMany();

  if (!db) {
    return c.json(
      {
        message: "Error retrieving posts from database",
        docs: "http://localhost:3000/docs/api-reference/",
      },
      400
    );
  }
  return c.json({ posts: results }, 200);
});

posts.openapi(createPost, async (c) => {
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json(
      {
        message: "unauthorized",
        docs: "http://localhost:3000/docs/api-reference/",
      },
      401
    );
  }
  const { title, post }: { title: string; post: string } = await c.req.json();
  if (!title || !post) {
    return c.json(
      {
        message: "Missing title or post",
        docs: "http://localhost:3000/docs/api-reference/",
      },
      400
    );
  }

  const db = connectDatabase(c);

  const results = await db
    .insert(postsTable)
    .values({ title, post })
    .returning()
    .execute();
  if (!results[0].id) {
    return c.json(
      {
        message: "Error creating post, please try again later.",
        docs: "http://localhost:3000/docs/api-reference/",
      },
      400
    );
  }
  return c.json({}, 201);
});

posts.openapi(getPost, async (c) => {
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json(
      {
        message: "unauthorized",
        docs: "http://localhost:3000/docs/api-reference/",
      },
      401
    );
  }

  const db = connectDatabase(c);

  const id = c.req.param("id");
  const cache = c.get("cache");
  const post = await cache.post.swr(id, async () => {
    return await db.query.posts.findFirst({
      where: (table, { eq }) => eq(table.id, parseInt(id)),
    });
  });
  if (!post.val) {
    return c.json(
      {
        message: "Post does not exist with this id",
        docs: "http://localhost:3000/docs/api-reference/",
      },
      404
    );
  }

  if (
    post.val.post === null ||
    post.val.id === null ||
    post.val.title === null
  ) {
    return c.json(
      {
        message: "Post does not exist with this id",
        docs: "http://localhost:3000/docs/api-reference/",
      },
      404
    );
  }

  return c.json(
    {
      post: post.val.post,
      id: post.val.id,
      title: post.val.title,
    },
    200
  );
});

posts.openapi(updatePost, async (c) => {
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json(
      {
        message: "unauthorized",
        docs: "http://localhost:3000/docs/api-reference/",
      },
      401
    );
  }
  const postId = Number.parseInt(c.req.param("id"));
  const { title, post } = await c.req.json();
  const db = connectDatabase(c);

  const results = await db
    .update(postsTable)
    .set({ title, post })
    .where(eq(postsTable.id, postId))
    .returning();
  if (results.length === 0) {
    return c.json(
      {
        message: "Post does not exist with this id",
        docs: "http://localhost:3000/docs/api-reference/",
      },
      404
    );
  }
  return c.json(
    {
      id: results[0].id,
      post: results[0].post,
      title: results[0].title,
    },
    200
  );
});

posts.openapi(deletePost, async (c) => {
  const result = c.get("unkey");
  if (!result?.valid) {
    return c.json(
      {
        message: "unauthorized",
        docs: "http://localhost:3000/docs/api-reference/",
      },
      401
    );
  }
  const postId = parseInt(c.req.param("id"));

  const db = connectDatabase(c);

  const results = await db
    .delete(postsTable)
    .where(eq(postsTable.id, postId))
    .returning();
  if (!results[0].id) {
    return c.json(
      {
        message: `Post does not exist with this id: ${postId}`,
        docs: "http://localhost:3000/docs/api-reference/",
      },
      404
    );
  }
  return c.json({}, 201);
});

export { posts };
