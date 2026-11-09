import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../dist");
const port = 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";

  const file = normalize(join(root, pathname));
  if (!file.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  let stat;
  try {
    stat = statSync(file);
  } catch {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const target = stat.isDirectory() ? join(file, "index.html") : file;
  response.writeHead(200, {
    "Content-Type": types[extname(target)] ?? "application/octet-stream",
  });
  createReadStream(target).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`test server: http://127.0.0.1:${port}/blog.html`);
});
