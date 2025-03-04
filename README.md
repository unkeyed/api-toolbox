# Unkey Toolbox CLI

Unkey's toolbox CLI is a command line interface that provides a set of tools to help developers build performant APIs.

Currently, the CLI provides the following:

- _Generated API Demo_: A generated API demo that demonstrates how to build a performant API using Hono, Turso, Unkey and a choice of ORM (Drizzle or Prisma).

- _Documentation_: Documentation through the FumaDocs open source project, including generated API documentation from the generated API demo.

![CLI example](https://github.com/unkeyed/api-toolbox/blob/main/cli-example.gif)

## How to setup and test

```bash
git clone https://unkeyed/api-toolbox
cd api-toolbox
npm install
npm run dev
```

If you want to build the CLI, you can run `npm run build`.You can then use either npm link or you can just run `node <directory>/dist/index.js` to run the CLI.

## Acknowledgements

I would like to thank Create T3 for the incredible work they did on the [`create-t3` CLI](https://github.com/t3-oss/create-t3-app). It was a great way example of how to build a CLI and I used it as a reference when building this CLI to be extenable.
