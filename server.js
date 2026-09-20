const http = require("http");
const fs = require("fs");
const path = require("path");
const githubHandler = require("./api/github.js");
const ecosystemHandler = require("./api/ecosystem.js");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 10000);

function apiAdapter(handler, req, res) {
  res.status = function(code) {
    res.statusCode = code;
    return res;
  };
  res.json = function(payload) {
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    res.end(JSON.stringify(payload));
  };
  return Promise.resolve(handler(req, res)).catch(error => {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    res.end(JSON.stringify({ ok: false, error: "SERVER_ERROR", message: error.message }));
  });
}

function mime(file) {
  const ext = path.extname(file).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".webp": "image/webp",
    ".ico": "image/x-icon"
  }[ext] || "application/octet-stream";
}

function serveFile(file, res) {
  fs.readFile(file, (error, data) => {
    if (error) {
      res.statusCode = error.code === "ENOENT" ? 404 : 500;
      res.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", mime(file));
    if (file.includes(path.sep + "assets" + path.sep)) {
      res.setHeader("Cache-Control", "public, max-age=300");
    }
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/api/github") {
    return apiAdapter(githubHandler, req, res);
  }
  if (url.pathname === "/api/ecosystem") {
    return apiAdapter(ecosystemHandler, req, res);
  }

  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const candidate = path.resolve(ROOT, "." + pathname);
  if (!candidate.startsWith(ROOT + path.sep) && candidate !== path.join(ROOT, "index.html")) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }
  serveFile(candidate, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("MCF Cockpit Next listening on port", PORT);
});
