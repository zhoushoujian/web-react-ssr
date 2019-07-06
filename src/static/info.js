/*
 * 处理文件信息
 */

const path = require('path');
const url = require('url');
const os = require('os');

let getFileInfo = function (req, res, workspace) {
  let pathResolve = workspace;
  if (!pathResolve) {
    pathResolve = path.resolve().replace(/\\/, '/') + '';  //如果没有指定静态文件的路径，就设此路径为默认路径
  }
  let pathname = url.parse(req.url).pathname;   //获取不包括域名的访问地址的名称
  pathname = decodeURIComponent(pathname);
  //console.log("pathname",pathname)
  let filePath = pathResolve + pathname;
  //console.log("filePath",filePath)
  let pathArr = filePath.split('\/');   //将获取的名称专为数组
  let fileName = pathArr[ pathArr.length - 1 ];   //取所访问的文件名（字符串）
  let basePath = pathArr.slice(0, pathArr.length - 1).join('/');   //取不包含文件名的路径
  let extName = path.extname(filePath);
  extName = extName ? extName.slice(1) : 'unknown';  //获取后缀名
  console.log("info filePath ",filePath)
  // 判断操作平台

  let platform = os.platform();

  if (platform === 'win32') {
    basePath = basePath.replace(/\//g, '\\');  //处理斜杠
    filePath = filePath.replace(/\//g, '\\');
  } else {
    basePath = basePath.replace(/\\/g, '\/');
    filePath = filePath.replace(/\\/g, '\/');
  }
  return {
    'basePath': basePath,  //不包含文件名的路径
    'filePath': filePath,  //包含了文件的全路径
    'fileName': fileName,  //文件名
    'extName': extName  //后缀名
  };
};

module.exports = getFileInfo;
