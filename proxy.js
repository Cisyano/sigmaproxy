const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs').promises;
const path = require('path');

const proxy = http.createServer(async (req, res) => {
    if (req.url === '/') {
        try {
            const htmlPath = path.join(__dirname, 'index.html');
            const htmlContent = await fs.readFile(htmlPath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlContent);
        } catch (err) {
            console.error('Error serving HTML:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Could not serve the HTML page.');
        }
        return;
    }

    const parsedUrl = url.parse(req.url);
    if (!parsedUrl.hostname) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid URL provided.');
        return;
    }

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + (parsedUrl.search || ''),
        method: req.method,
        headers: req.headers,
    };

    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    const proxyReq = protocol.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    req.pipe(proxyReq);

    proxyReq.on('error', (err) => {
        console.error('Proxy request error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Something went wrong with the proxy request.');
    });
});

const port = 3000;
proxy.listen(port, () => {
    console.log(`Web proxy server listening on port ${port}`);
});