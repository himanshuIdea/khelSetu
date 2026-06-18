import type { Context } from "hono";

export async function proxyRequest(c: Context, baseUrl: string, path: string) {
  const url = new URL(path, baseUrl);
  url.search = new URL(c.req.url).search;

  const forwardHeaders: Record<string, string> = {
    "content-type": c.req.header("content-type") ?? "application/json",
  };

  const cookie = c.req.header("cookie");
  if (cookie) forwardHeaders.cookie = cookie;

  const authorization = c.req.header("authorization");
  if (authorization) forwardHeaders.authorization = authorization;

  const response = await fetch(url, {
    method: c.req.method,
    headers: forwardHeaders,
    body: c.req.method === "GET" || c.req.method === "HEAD" ? undefined : await c.req.text(),
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}
