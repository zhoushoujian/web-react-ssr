import express from "express"
import path from "path"
import fs from "fs"
import util from "util"
import url from "url"
import formidable from "formidable"
import Render from "./static/render"

import React from "react";
import { renderToNodeStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import App from "./components/fileServer";
import { updateFileList, updateText, createDuxStore } from "./store";

const app = express();
app.use( express.static( path.resolve( __dirname, "../dist" ) ) );

app.all('*', function (req, res, next){
    getIp(req, req.url);
    next()
})

app.get( "/", ( req, res ) => {
    const context = { };
    let finalList = [];
    let content = fs.readdirSync(path.join(__dirname, "Images"));
    for(let i=0; i<content.length; i++){
        let singleList = [],
            filePath = path.join(__dirname + "/Images/" + content[i]);
        singleList.push(content[i]);
        let stats = fs.statSync(filePath);
        singleList.push(stats.size);
        finalList.push(singleList);
    };
    const store = createDuxStore( );
    store.dispatch(updateText("456"))
    store.dispatch( updateFileList(finalList));
    const reduxState = store.getState();
    res.writeHead( 200, { "Content-Type": "text/html" } );
    res.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>React SSR</title>
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
            <link rel="stylesheet" href="./css/bundle.fileServer.css">
        </head>
        
        <body>
            <div id="app">`
    )
    const reactDom = renderToNodeStream(
        (<ReduxProvider store={ store }>
            <StaticRouter context={ context } location={ req.url }>
                <App />
            </StaticRouter>
        </ReduxProvider>)
    );
    reactDom.pipe(res, { end: false });
    reactDom.on('end', () => {
        res.write(`</div>
                <script>
                    window.REDUX_DATA = ${ JSON.stringify( reduxState ) }
                </script>
                <script src="./js/bundle.js"></script>
                <script src="./js/fileServer.js"></script>
                <script src="./js/manifest.js"></script>
                <script src="./js/vendor.js"></script>
            </body>
            </html>
        `);
        res.end();
    })
} );

app.post("/Images", uploadFiles);
// app.get("/get_list", getFilesList);
app.delete(/\/delete_file\/(.+)/, deleteFiles);
app.get(/\/(Images)\/(.+)/, fileDownload);

function uploadFiles(req, res){
    try{
        //上传文件
        let files = [];
        let form = new formidable.IncomingForm();
        form.multiples = true; //启用多文件上传
        form.maxFileSize = 1 * 1024 * 1024 * 1024; //限制上传最大文件为1GB
        form.on('file', function(filed, file) {
            files.push([filed, file]);
        }).parse(req, function(err, fields, files) {
        // console.debug("fields", fields);
        // console.debug("files", files);
        if (err) {
            console.debug(`uploadFiles formidable err` + err.message);
            return reportError(req, res, err);
        }
        let filesArray = files.files;
        let filesNum = files.files && files.files.length;
        if (Object.prototype.toString.call(files.files) === '[object Object]') {
            let filesName = files.files.name;
            let fileSize = files.files.size;
            console.info(` 上传的是单文件`, filesName);
            /*  if (!/\.exe$|\.apk$/gim.test(filesName)) {
                 return res.end("非法类型的文件");
             } else  */
            if (/%|#/g.test(filesName)) {
                return writeResponse(res, "illegal_filename");
            } else if (fileSize > 1 * 1024 * 1024 * 1024) {
                return writeResponse(res, "more_than_1gb");
            }
            res.writeHead(200, {
                'content-type': 'application/octet-stream'
            });
            res.write('received upload:\n\n');
            //console.debug("files", files.files.path);
            let readStream = fs.createReadStream(files.files.path);
            let writeStream = fs.createWriteStream(path.join(__dirname, "Images/" + filesName));
            readStream.pipe(writeStream);
            readStream.on('end', function() {
                fs.unlinkSync(files.files.path);
            });
        } else {
            console.debug(`  上传的是多文件`);
            for (let i = 0; i < filesNum; i++) {
                console.debug(`  上传的文件名`, filesArray[i].name);
                /* if (!/\.exe$|\.apk$/gim.test(filesArray[i].name)) {
                    return res.end("非法类型的文件");
                } else  */
                if (/%|#/g.test(filesArray[i].name)) {
                    return writeResponse(res, "illegal_filename");
                } else if (filesArray[i].size > 1 * 1024 * 1024 * 1024) {
                    return writeResponse(res, "more_than_1gb");
                }
                res.write('received upload:\n\n');
                let readStream = fs.createReadStream(files.files[i].path);
                let writeStream = fs.createWriteStream("Images/" + filesArray[i].name);
                readStream.pipe(writeStream);
                readStream.on('end', function() {
                    fs.unlinkSync(files.files[i].path);
                });
            }
        }
        res.end(util.inspect({
            fields: fields,
            files: files
        }));
        });
    } catch (err) {
        console.error("uploadFiles error", err.stack || err.toString());
        return reportError(req, res, err);
    }
}

// function getFilesList(req, res){
//     try {
//         let finalList = [];
//         let content = fs.readdirSync(path.join(__dirname, "Images"));
//         for(let i=0; i<content.length; i++){
//             let singleList = [],
//                 filePath = path.join(__dirname + "/Images/" + content[i]);
//             singleList.push(content[i]);
//             let stats = fs.statSync(filePath);
//             singleList.push(stats.size);
//             finalList.push(singleList);
//         };
//         console.debug(` server  反馈给ajax的请求`, finalList.length);
//         return writeResponse(res, finalList);
//     } catch (err) {
//         console.error("getFilesList error", err.stack || err.toString());
//         return reportError(req, res, err);
//     }
// }

function deleteFiles(req, res){
    try{
        let pathname = url.parse(req.url).pathname;
        console.log("pathname", pathname)
        let filename = decodeURIComponent(pathname).split("/")[decodeURIComponent(pathname).split("/").length - 1];
        console.debug(` server delete filename`, filename);
        if (fs.existsSync(path.join(__dirname, `./Images/${filename}`))) {
            fs.unlink(path.join(__dirname, `./Images/${filename}`), function(err) {
                if (err) throw err;
                console.info(`  ${filename}删除成功!`);
                return writeResponse(res, "success");
            });
        } else {
            return writeResponse(res, "removed");
        }
    } catch (err) {
        console.error("deleteFiles error", err.stack || err.toString());
        return reportError(req, res, err);
    }
}

function fileDownload(req, res){
    try {
        const _render = new Render(req, res);
        _render.init()
    } catch (err){
        console.error("文件下载出错", err.stack || err.toString());
        return reportError(req, res, err);
    }
}

app.listen( 9527 );

console.info("server is running at 9527")

function getIp(req, str) {
    let ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';
    if (ip.split(',').length > 0) {
        ip = ip.split(',')[0]
    }
    console.info(` ${str}的访问者ip`, ip);
}
function writeResponse(res, data) {
    if(res) {
        try {
            let wrapper = JSON.stringify({
                    status : 'SUCCESS',
                    result : data
                }),
                tmpBuf = Buffer.from(wrapper),
                headers = {};
            headers['content-length'] = tmpBuf.length;
            headers['content-type']   = 'application/json';
            res.writeHead(200, headers);
            res.write(tmpBuf);
            res.end();
            tmpBuf = null;
        } catch(e) {
            // Don't leave the client handing
            console.error("writeResponse e", e.stack || e.toString());
            res.status(500).end(e.stack || e.toString());
        }
    }
}
function reportError(req, res, userErr) {
    try {
        console.error("url", req.originalUrl, 'userErr', userErr.stack||userErr.toString())
        var wrapper = JSON.stringify({
            status  : 'FAILURE',
            result  : {
                errCode : 500,
                errText : userErr.stack||userErr.toString()
            }
        });
        var tmpBuf = Buffer.from(wrapper);
        var headers = {
            'content-length' : tmpBuf.length,
            'content-type'   : 'application/json'
        };
        res.writeHead(500, headers);
        res.write(tmpBuf);
        res.end();
        tmpBuf = null;
    } catch(e) {
        // Don't leave client hanging
        res.status(500).end();
        console.error("reportError e", e.stack || e.toString())
    }
}
