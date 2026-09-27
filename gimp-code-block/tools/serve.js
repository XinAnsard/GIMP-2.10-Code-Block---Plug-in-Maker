#!/usr/bin/env node
// Tiny static server for development: rebuilds on request, no dependency.
//   node tools/serve.js [port]
// Open http://localhost:8080 — each reload re-runs the Python build, so editing
// a file in src/ and pressing F5 is enough.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'gimp-code-block.html');
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

function build() {
  try {
    execFileSync('python3', [path.join(ROOT, 'tools', 'build.py')], { stdio: 'pipe' });
    return null;
  } catch (e) {
    return (e.stderr || e.stdout || Buffer.from(String(e))).toString();
  }
}

http.createServer((req, res) => {
  if (req.url !== '/' && req.url !== '/index.html') {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  const err = build();
  if (err) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Build failed:\n\n' + err);
    return;
  }
  const html = fs.readFileSync(OUT);
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(html);
}).listen(PORT, () => {
  console.log('GIMP Code Block — dev server on http://localhost:' + PORT);
  console.log('Edit anything in src/, then reload the page.');
});
