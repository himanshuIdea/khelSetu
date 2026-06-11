import type { Context } from "hono";

export async function proxyRequest(c: Context, baseUrl: string, path: string) {
  const url = new URL(path, baseUrl);
  url.search = new URL(c.req.url).search;

  const response = await fetch(url, {
    method: c.req.method,
    headers: {
      "content-type": c.req.header("content-type") ?? "application/json",
    },
    body: c.req.method === "GET" || c.req.method === "HEAD" ? undefined : await c.req.text(),
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}
