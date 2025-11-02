const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// 靜態文件 MIME 類型
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  // 移除查詢字符串
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);

  // 安全檢查：防止目錄遍歷攻擊
  const resolvedPath = path.resolve(filePath);
  const baseDir = path.resolve(__dirname);

  if (!resolvedPath.startsWith(baseDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // 讀取文件
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 檢查是否是目錄，如果是則嘗試 index.html
        fs.stat(filePath, (statErr, stats) => {
          if (!statErr && stats.isDirectory()) {
            const indexPath = path.join(filePath, 'index.html');
            fs.readFile(indexPath, (indexErr, indexContent) => {
              if (!indexErr) {
                res.writeHead(200, { 'Content-Type': mimeTypes['.html'] });
                res.end(indexContent);
              } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
              }
            });
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    } else {
      // 根據文件擴展名設置 Content-Type
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      // 設置 CORS 標頭
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        // ⚠️ config.js 不應該快取，否則更新後用戶看不到
        'Cache-Control': filePath.endsWith('config.js') ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
