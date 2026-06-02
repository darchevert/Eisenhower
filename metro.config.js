const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

const WEB_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Eisenhower — Priority Matrix</title>
    <style>
      html, body { height: 100%; margin: 0; }
      body { overflow: hidden; }
      #root { display: flex; height: 100%; flex: 1; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.ts.bundle?platform=web&dev=true&hot=false"></script>
  </body>
</html>`;

config.server = {
  enhanceMiddleware: (metroMiddleware) => (req, res, next) => {
    const url = req.url.split('?')[0];
    if (url === '/' || url === '/index.html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(WEB_HTML);
      return;
    }
    return metroMiddleware(req, res, next);
  },
};

module.exports = config;
