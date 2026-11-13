const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Solicitud inválida');
    return;
  }

  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || relative.split('/').some(part => part.startsWith('.'))) {
    response.writeHead(403).end('Acceso denegado');
    return;
  }

  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Archivo no encontrado');
      return;
    }
    response.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(file).pipe(response);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Egreso Studio disponible en http://localhost:${port}`);
});
