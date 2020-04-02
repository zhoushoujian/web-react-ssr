import express from "express"
import path from "path"
import fs from "fs"
import util from "util"
import url from "url"
import os from "os"
import formidable from "formidable"
import Render from "./static/render"
import chokidar from "chokidar"
import { exec } from "child_process"
import WebSocket from "ws"
import Logger from "beauty-logger"

import React from "react";
import { renderToNodeStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import App from "./components/fileServer";
import { updateFileList, updateIsFromServeRender, createDuxStore } from "./store";

//config
const config = {
	useHotBuild: false
}

const logger = new Logger()
const connections = {}

const app = express();
app.use( express.static( path.resolve( __dirname, "../dist" ) ) );

app.all('*', function (req, res, next){
    getIp(req, req.url);
    next()
})

function getFileList(){
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
	return finalList;
}

if(!global.window) global.window = global

app.get( "/", ( req, res ) => {
    const context = { };
    let finalList = getFileList();
    const store = createDuxStore( );
	store.dispatch(updateIsFromServeRender(true))
    store.dispatch(updateFileList(finalList));
    const reduxState = store.getState();
    res.writeHead( 200, { "Content-Type": "text/html" } );
    res.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
			<title>${'欢迎使用webSocket文件服务器'}</title>
			<meta name="description" content=${'description'} />
    		<meta name="keywords" content=${'keywords'} />
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
			<link rel="shortcut icon" href="./favicon.ico">
			<link rel='stylesheet' href='./css/0.fileServer.css'>
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
app.get("/get_list", getFilesList);
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
        // logger.info("fields", fields);
        // logger.info("files", files);
        if (err) {
            logger.info(`uploadFiles formidable err` + err.message);
            return reportError(req, res, err);
        }
        let filesArray = files.files;
        let filesNum = files.files && files.files.length;
        if (Object.prototype.toString.call(files.files) === '[object Object]') {
            let filesName = files.files.name;
            let fileSize = files.files.size;
            logger.info(` 上传的是单文件`, filesName);
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
            //logger.info("files", files.files.path);
            let readStream = fs.createReadStream(files.files.path);
            let writeStream = fs.createWriteStream(path.join(__dirname, "Images/" + filesName));
            readStream.pipe(writeStream);
            readStream.on('end', function() {
				fs.unlinkSync(files.files.path);
				let finalList = getFileList();
				writeWSResponse(finalList, 'get-files-array', null, req)
            });
        } else {
            logger.info(`  上传的是多文件`);
            for (let i = 0; i < filesNum; i++) {
                logger.info(`  上传的文件名`, filesArray[i].name);
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
					let finalList = getFileList();
					writeWSResponse(finalList, 'get-files-array', null, req)
                });
            }
		}
        res.end(util.inspect({
            fields: fields,
            files: files
        }));
        });
    } catch (err) {
        logger.error("uploadFiles error", err.stack || err.toString());
        return reportError(req, res, err);
    }
}

function getFilesList(req, res){
    try {
        let finalList = getFileList();
        logger.info(` server  反馈给ajax的请求`, finalList.length);
        return writeResponse(res, finalList);
    } catch (err) {
        logger.error("getFilesList error", err.stack || err.toString());
        return reportError(req, res, err);
    }
}

function deleteFiles(req, res){
    try{
        let pathname = url.parse(req.url).pathname;
        logger.info("pathname", pathname)
        let filename = decodeURIComponent(pathname).split("/")[decodeURIComponent(pathname).split("/").length - 1];
        logger.info(` server delete filename`, filename);
        if (fs.existsSync(path.join(__dirname, `./Images/${filename}`))) {
            fs.unlink(path.join(__dirname, `./Images/${filename}`), function(err) {
                if (err) throw err;
				logger.info(`  ${filename}删除成功!`);
				let finalList = getFileList();
				writeWSResponse(finalList, 'delete-files-array', null, req)
                return writeResponse(res, "success");
            });
        } else {
            return writeResponse(res, "removed");
        }
    } catch (err) {
        logger.error("deleteFiles error", err.stack || err.toString());
        return reportError(req, res, err);
    }
}

function fileDownload(req, res){
    try {
        const _render = new Render(req, res);
        _render.init()
    } catch (err){
        logger.error("文件下载出错", err.stack || err.toString());
        return reportError(req, res, err);
    }
}

function socketVerify(info) {
	return true;
}

let server = app.listen( 9527 );
var wss = new WebSocket.Server({
	server,
	perMessageDeflate: true,
	handleProtocols: "file",
	verifyClient: socketVerify
});

wss.on('connection', function connection(ws, req) {
	let id;
	getIp(req, "WebSocket connect");
	ws.on('message', function incoming(message) {
		try{
			message = JSON.parse(message)
			if(message.type === "try-connect"){
				logger.info('received: ', JSON.stringify(message));
				connections[message.id] = ws;
				id = message.id;
				writeWSResponse(Date.now(), "response-date", connections[message.id], req)
				writeWSResponse(`游客${message.id}加入`, 'order-string', null, req)
				writeWSResponse('当前共' + wss.clients.size + '位游客', 'order-string', null, req)
			} else if(message.type === "check-connect"){
				if(message.date === 'ping'){
					writeWSResponse(Date.now(), "heart-beat", connections[message.id], req)
				}
			}
		} catch (err){
			logger.error("incoming err", err)
		}
	});
	ws.on('close', (code, msg) => {
		if(code === 1001){
			delete connections[id];
			writeWSResponse(`游客${getIp(req, req.url)}离开`, 'order-string', null, req)
			writeWSResponse('当前共' + wss.clients.size + '位游客', 'order-string', null, req);
			ws.terminate()
		}
	})
});

function writeWSResponse(data, type="", connectionsId, req){
	logger.info("writeWSResponse data", data)
	if(req) logger.info("writeWSResponse current user ip", getIp(req, req.url))
	let response = Object.assign({},{
		status: 200,
		data,
		type
	})
	if(!connectionsId){
		//Server broadcast
		wss.clients.forEach(function each(client) {
			client.send(Buffer.from(JSON.stringify(response)), {
				binary: false
			})
		});
	} else {
		connectionsId.send(Buffer.from(JSON.stringify(response)), {
			binary: false
		})
	}
}

var address;
var networks = os.networkInterfaces()
Object.keys(networks).forEach(function (k) {
	for (var kk in networks[k]) {
		if (networks[k][kk].family === "IPv4" && networks[k][kk].address !== "127.0.0.1") {
			address = networks[k][kk].address;
		}
	}
})

logger.info(`server is running at ${address}:9527`)

function getIp(req, str) {
    let ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';
    if (ip.split(',').length > 0) {
        ip = ip.split(',')[0]
    }
	logger.info(` ${str}的访问者ip`, ip);
	return ip
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
            logger.error("writeResponse e", e.stack || e.toString());
            res.status(500).end(e.stack || e.toString());
        }
    }
}
function reportError(req, res, userErr) {
    try {
        logger.error("url", req.originalUrl, 'userErr', userErr.stack||userErr.toString())
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
        logger.error("reportError e", e.stack || e.toString())
    }
}

process.on('unhandledRejection', (error) => {
    logger.error('unhandledRejection', error);
});

process.on('uncaughtException', function(error) {
    logger.error('uncaughtException', error);
});

//hot build
{
	if (config.useHotBuild) {
		let dst_path = path.join(__dirname, "./components"),
			workTimer;
		const watcher = chokidar.watch(dst_path, {
			ignored: /(^|[\/\\])\..|node_modules/,
			persistent: true
		});
		watcher.on('ready', () => logger.info('Initial scan complete. Ready for changes'));
		logger.info("begin to monitor")
		watcher
			.on('error', error => logger.error(`Watcher error`, error))
			.on('all', (event, path) => {
				logger.warn("监听到了文件变化")
				if (workTimer) {
					clearTimeout(workTimer);
				}
				workTimer = setTimeout(function () {
					clearTimeout(workTimer);
					logger.debug("开始执行构建")
					console.debug(__dirname)
					// process.chdir(require('path').resolve(__dirname.slice(0,-3)));
					console.log(require('path').resolve(__dirname.slice(0, -3)))
					let child1 = exec("yarn build");
					child1.stdout.on('data', function (data) {
						logger.debug('子进程', data.toString());
					});
					child1.stderr.on('data', function (data) {
						// logger.warn("stderr", data);
					});
					child1.on('exit', function (code) {
						logger.debug('子进程1已退出，代码：' + code);
					})
				}, 3000)
			})
		//捕获异常
		process.on('uncaughtException', function (err) {
			if (err == "Error: kill ESRCH") {
				logger.error("Error: kill ESRCH 子进程已退出");
			} else {
				logger.warn('Caught exception: ' + err);
			}
		});
	}
}
