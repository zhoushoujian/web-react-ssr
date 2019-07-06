/*
 * 处理目录路径
 */

const path = require('path');
const url = require('url');
const setting = require('./setting');
const walk = require('./walk');

function dir (req, res) {
  let pathResolve = setting.workspace;
  let pathname = url.parse(req.url).pathname;
  if (!pathResolve) {
    pathResolve = path.resolve().replace(/\\/g, '/') + '../../Images';
  }
  pathResolve = pathResolve + pathname;

  let files = walk(pathResolve);
  let html = '<ul>';
  if (pathname.substr(pathname.length - 1, 1) !== '/') {
    pathname = pathname + '/';
  }

  for (let i = 0, len = files.length; i < len; i++) {
    html += '<li><a href="' + pathname + files[i] + '">' + files[i] + '</a></li>';
  }
  html += '</ul>';

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(html);
  res.end();
}

module.exports = dir;
