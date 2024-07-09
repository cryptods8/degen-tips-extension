# $DEGEN Tips server

This is a [Next.js](https://nextjs.org/)-based server used by the [extension](/apps/extension/README.md) for $DEGEN tips validation

## Demo

DEMO instance is currently running on vercel at [degen-tips-server.vercel.app](https://degen-tips-server.vercel.app)

## Getting Started

First, create your own `.env` file in the `apps/server` directory (you can use the `.env.sample` file included for inspiration), you must set the following environment variables:

- `API_KEY` - API key used by the extension (it's effectively public - can be found in the extension build)

Then you can run the server from the monorepo root directory:

```
pnpm dev --filter=server
```
