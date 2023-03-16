#!/usr/bin/env -S deno run -A
const server = Deno.listen({ port: 8080 });

interface StaticFile {
  // should be consistent with Deno URL pathname
  path: string;
  // what this is served as
  contentType: string;
}

const INDEX: StaticFile = {
  path: "/index.html",
  contentType: "text/html; charset=utf-8",
};

const STATIC_FILES: StaticFile[] = [
  ["/index.js", "text/javascript"],
  ["/index.css", "text/css"],
  ["/node_modules/xterm/lib/xterm.js", "text/javascript"],
  ["/node_modules/xterm/css/xterm.css", "text/css"],
].map(([path, contentType]): StaticFile => ({ path, contentType }));
STATIC_FILES.push(INDEX);

// shell stuff =================================================================

async function shell(cmd: string): Promise<string> {
  console.debug(`cmd: ${cmd}`);

  const process = Deno.run({
    cmd: ["/bin/sh", "-c", cmd],
    stdout: "piped",
    stderr: "piped",
  });

  const strm = await process.output();
  const output = new TextDecoder().decode(strm);

  console.debug(`output: ${output}`);

  return output;
}

// server ======================================================================

for await (const conn of server) {
  serveHttp(conn);
}

async function staticResponse(st: StaticFile): Promise<Response> {
  const local_path = `.${st.path}`;
  const file = await Deno.readFile(local_path)
    .catch((err) => {
      console.error(`unable to load file from ${local_path}`);
      console.error(err);
      return undefined;
    });

  if (file === undefined) {
    return new Response("404: file not found.", {
      status: 404,
      headers: {
        "content-type": "text/plain",
      }
    });
  }

  return new Response(file, {
    status: 200,
    headers: {
      "content-type": st.contentType,
    },
  });
}

async function shellResponse(cmd: string): Promise<Response> {
  return new Response(await shell(cmd), {
    status: 200,
    headers: {
      "content-type": "text/utf-8",
    },
  });
}

async function respondTo(ev: Deno.RequestEvent): Promise<void> {
  const { pathname } = new URL(ev.request.url);

  // serve command execution (TODO)
  if (pathname.endsWith('exec')) {
    const cmd = await ev.request.text();
    ev.respondWith(await shellResponse(cmd));
    return;
  }

  // serve static files
  for (const st of STATIC_FILES) {
    if (pathname == st.path) {
      ev.respondWith(staticResponse(st));
      return;
    }
  }

  // serve index.html
  ev.respondWith(staticResponse(INDEX));
}

async function serveHttp(conn: Deno.Conn): Promise<void> {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    respondTo(requestEvent);
  }
}