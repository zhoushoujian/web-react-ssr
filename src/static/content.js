/*
 * 访问文件内容
 */

const fs = require('fs');
const config = require('./config');

let mimes = config.mimes;

function fileMime (extName) {
  return mimes[ extName ] || 'text/plain';
}

function getFileContent (req, res, filePath, extName) {
  let contentType = fileMime(extName);

  let stat = fs.statSync(filePath);
  let lastModified = stat.mtime.toUTCString();
  let ifModifiedSince = 'If-Modified-Since'.toLowerCase();
  res.setHeader('Last-Modified', lastModified);

  if (extName.match(config.Expires.fileMatch)) {
    let expires = new Date();
    expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
    res.setHeader('Expires', expires.toUTCString());
    res.setHeader('Cache-Control', 'max-age=' + config.Expires.maxAge);
  }

  if (req.headers[ifModifiedSince] && lastModified === req.headers[ifModifiedSince]) {
    res.writeHead(304, 'Not Modified');
    res.end();
  } else {
    let content = fs.readFileSync(filePath, 'binary');
    if (content) {
      console.log("content  下载文件")
      res.writeHead(200, {"Content-Length": content.length,'Content-Type': "application/octet-stream"});
      res.write(content, 'binary');
      res.end();
    } else {
      res.writeHead(500, {'Content-Type': 'text/plain'});
      console.log("content  显示文件");
      res.end();
    }
  }
}

module.exports = getFileContent;
