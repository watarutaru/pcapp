// Expo Metro proxy: rewrites Metro's local URLs to use the Cloudflare tunnel URL
const http = require('http');

const METRO_PORT = 8081;
const PROXY_PORT = 8090;

const server = http.createServer((req, res) => {
  const cfHost = req.headers['host'] || `localhost:${PROXY_PORT}`;

  const forwardHeaders = { ...req.headers, host: `127.0.0.1:${METRO_PORT}` };
  delete forwardHeaders['x-forwarded-proto'];
  delete forwardHeaders['x-forwarded-for'];
  delete forwardHeaders['cf-visitor'];
  delete forwardHeaders['cf-connecting-ip'];
  // multipart/mixedを回避してJSONで受け取り、URLを書き換えられるようにする
  forwardHeaders['accept'] = 'application/json';

  const options = {
    hostname: '127.0.0.1',
    port: METRO_PORT,
    path: req.url,
    method: req.method,
    headers: forwardHeaders,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    const contentType = proxyRes.headers['content-type'] || '';

    if (contentType.includes('application/json') || contentType.includes('text/plain')) {
      const chunks = [];
      proxyRes.on('data', chunk => chunks.push(chunk));
      proxyRes.on('end', () => {
        let body = Buffer.concat(chunks).toString('utf8');
        body = body
          .replace(new RegExp(`http://127\\.0\\.0\\.1:${METRO_PORT}`, 'g'), `https://${cfHost}`)
          .replace(new RegExp(`http://localhost:${METRO_PORT}`, 'g'), `https://${cfHost}`)
          .replace(new RegExp(`"127\\.0\\.0\\.1:${METRO_PORT}"`, 'g'), `"${cfHost}"`)
          .replace(new RegExp(`"localhost:${METRO_PORT}"`, 'g'), `"${cfHost}"`);
        // キャッシュ回避: プロジェクトIDをリクエストごとにランダム化
        body = body.replace(/"id":"[^"]*"/, `"id":"${require('crypto').randomUUID()}"`);
        // Hermesバイトコードを無効化してプレーンJSで配信（バージョン不一致対策）
        body = body.replace(/transform\.bytecode=1/g, 'transform.bytecode=0');

        const headers = { ...proxyRes.headers };
        headers['content-length'] = Buffer.byteLength(body).toString();
        delete headers['content-encoding'];

        res.writeHead(proxyRes.statusCode, headers);
        res.end(body);
      });
    } else {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  });

  req.pipe(proxyReq);
  proxyReq.on('error', err => {
    res.writeHead(502);
    res.end('Proxy error: ' + err.message);
  });
});

server.listen(PROXY_PORT, () => {
  console.log(`Expo proxy running: http://localhost:${PROXY_PORT} -> Metro :${METRO_PORT}`);
  console.log('Rewrites Metro URLs to use incoming Host header (Cloudflare tunnel URL)');
});
