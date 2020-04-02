import React from 'react';
import { connect } from "react-redux";
import { confirm, alert, calcSize } from "../utils";
import { updateFileList } from "../store";
import { networkErr } from "../utils";
import axios from "axios";
import { URL, domain } from "./constant";

String.prototype.format = function() {
	var str = this.toString();
	if (!arguments.length)
			return str;
	var args = typeof arguments[0];
	args = (("string" == args || "number" == args) ? arguments : arguments[0]);
	for (var arg in args) {
			var replace = args[arg] != null ? args[arg] : '';
			str = str.replace(RegExp("\\{" + arg + "\\}", "gi"), replace);
	}
	return str;
};

function uploadProgress (evt) {
    if (evt.lengthComputable) {
        var percentComplete = Math.round(evt.loaded * 100 / evt.total);
        document.getElementById('progress').innerHTML = percentComplete.toString() + '%';
    } else {
        document.getElementById('progress').innerHTML = 'uncomputable';
    }
}

function uploadFailed(evt) {
    alert("上传失败");
    console.error("上传失败", evt);
}

class FileServer extends React.Component {

    componentDidMount(){
		let self = this, id;
		if('localStorage' in window){
			if(window.localStorage.getItem("id")){
				id = window.localStorage.getItem("id")
			} else {
				id = String(Date.now() + (Math.random()*10000).toFixed(0))
				window.localStorage.setItem("id", id);
			}
		}
		if(window.WebSocket){
			this.ws = new WebSocket(`ws://${domain}`);
			this.ws.onopen = () => {
				self.openWS(self, self.ws.readyState, id)
				let checkState = setInterval(() => {
					if(self.ws.readyState !== 1){
						self.ws.close()
						console.warn("正在重新建立连接...");
						self.ws = new WebSocket(`ws://${domain}`);
						self.ws.onopen = () => self.openWS(self, self.ws.readyState, id);
						self.ws.onmessage = (data) => self.incomingMessage(data);
					} else {
						let message = Object.assign({},{ type:'check-connect', id, date: "ping" });
						self.ws.send(JSON.stringify(message));
					}
				}, 20000)
			};
			this.ws.onmessage = (data) => this.incomingMessage(data);
		} else {
			console.info("不支持webSocket！！！")
		}
		console.log("REDUX_DATA", REDUX_DATA.fileServer)
	}

	openWS = (self, readyState, id) => {
		console.log('connected', readyState);
		// console.log("当前游客id", id)
		let msg = Object.assign({},{
			type:'try-connect',
			id,
			date: Date.now()
		})
		self.ws.send(JSON.stringify(msg));
	}

	incomingMessage = (data) => {
		try {
			data = JSON.parse(data.data);
			switch(data.type){
				case "response-date":
					console.log(`Roundtrip time: ${Date.now() - data.data} ms`);
					break;
				case "order-string":
					console.log(data.data);
					break;
				case "get-files-array":
					$dispatch(updateFileList(data.data));
					console.log(data);
					break;
				case "delete-files-array":
					$dispatch(updateFileList(data.data));
					console.log(data);
					break;
				case "heart-beat":
					console.log(data);
				default:
					break;
			}
		} catch (err){
			console.error("onmessage JSON.parse", err)
		}
	}

    uploadFiles = () => {
        let filename, fileSize, fileList;
        let files = document.getElementById('fileToUpload').files;
        let fileNum = document.getElementById('fileToUpload').files.length;
        let i = 0
        if (fileNum) {
            function submit() {
                filename = document.getElementById('fileToUpload').files[i].name;
                fileSize = document.getElementById('fileToUpload').files[i].size;
                /* if (!/\.exe$|\.apk$/gi.test(filename)) {
                    alert("不允许上传后缀名除exe|apk以外的文件");
                    return
                } else  */
                if (/#|%/g.test(filename)) {
                    alert("文件名不能包含%或#");
                    return
                } else if (fileSize > 1024 * 1024 * 1024) {
                    alert('文件大小超过1GB');
                    return
                }
                document.getElementById('btnSubmit').value = "上传中";
                var formData = new FormData();
                formData.append('files', files[i]);
                var xhr = new XMLHttpRequest();
                xhr.upload.addEventListener("progress", uploadProgress, false);
                xhr.addEventListener("error", uploadFailed, false);
                xhr.open('POST', URL.upload);
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        // console.info('上传成功' + xhr.responseText);
                        /* if (xhr.responseText === "非法类型的文件") {
                            alert('非法类型的文件');
                        } else  */
                        if (xhr.responseText === "illegal_filename") {
                            alert('非法的文件名');
                        } else if (xhr.responseText === "more_than_1gb") {
                            alert('文件大小超过1GB');
                        } else {
                            fileList = window.$getState().fileServer.fileList;
                            fileList.push([filename, fileSize]);
                            fileList = fileList.sort();
                            alert('上传成功！');
                            document.getElementById('btnSubmit').value = "上传";
							document.getElementById('progress').innerHTML = '';
							console.log("上传: ", filename)
                            // window.$dispatch(updateText(Math.random()))
                            // window.$dispatch(updateFileList(fileList))
                            i++
                            if (i >= fileNum) {
                                return;
                            }
                            submit();
                        }
                    }
                };
                xhr.send(formData);
            }
            submit()
        }
    }

    render() {
        let { fileList, text } = this.props;
        return (
            <div className="file-server">
                <h2 className='head'> 文件列表 </h2>
                <div className="upload-area">
                    <input type="file" id="fileToUpload" style={{"backgroundImage": "none"}} multiple />
                    <div className="upload">
                        <input type="button" name="submit" id="btnSubmit" value="上传" onClick={this.uploadFiles} />
                        <div id='progress'></div>
                    </div>
                </div>
                <div id="container">
                    {fileList.length
                        ? fileList.map((item, index) => <Child fileInfo={item} key={index} />)
                        : null}
                </div>
                <div style={{"display": "none"}}>{text}</div>
            </div>
        );
    }
}

class Child extends React.Component{

    downloadFile = (filename) => {
        let downloadFileUrl = URL.download.format({filename});
        window.location.href = downloadFileUrl;
    }

    deleteFile = (filename) => {
        let { fileList } = window.$getState().fileServer;
        let list = [], self=this;
        this.updateFileList = updateFileList;
        this.networkErr = networkErr;
        for(let i=0; i<fileList.length; i++){
            list.push(fileList[i][0])
        }
        confirm("提示", "确定要删除吗?", "确定", function(){
            axios.delete(URL.delete.format({filename}))
                .then(response => {
					console.log("删除: ", filename)
                    fileList.splice(list.indexOf(filename), 1);
                    if (response.data.result === 'removed') {
                        alert("文件已删除!");
                        return;
                    } else if (response.data.result === 'success'){
                        alert("删除成功!");
                    } else {
                        alert("删除失败!");
                    }
                    // window.$dispatch(updateText(Math.random()))
                    // window.$dispatch(updateFileList(fileList))
                })
                .catch(error => {
                    console.error("删除文件过程中发生了错误", error.stack||error.toString());
                    self.networkErr(error);
                })
        })
    }

    render(){
        let { fileInfo } = this.props;
        return (
            <div className="file-item">
                <span title={fileInfo[0]} onClick={() => this.downloadFile(fileInfo[0])} className="file-link">{fileInfo[0]}</span>
                <span className="file-size">{calcSize(fileInfo[1])}</span>
                <span className="delete-file" onClick={() => this.deleteFile(fileInfo[0])}>删除</span>
            </div>
        )
    }
}


const mapStateToProps = state => {
    return {
        fileList: state.fileServer.fileList,
		text: state.fileServer.text
    };
};

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(FileServer);
