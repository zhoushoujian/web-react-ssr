import {Modal, Toast} from "antd-mobile";

export const alert = function (title, button = "确定", cb) {
	if (!cb) {
		cb = () => {};
	}
	Modal.alert(title, '', [{
		text: button,
		onPress: cb
	}, ]);
}

export const confirm = function(title, text, button="确定", cb, cancelFunc=false){
	Modal.alert(title, text, [
		{ text: '取消', onPress: () => {
			console.info(`confirm cancel`);
			if(cancelFunc){
				cancelFunc();
			}
		} },
		{
			text: button,
			onPress: () =>
				new Promise((resolve) => {
					resolve(cb())
				}),
		},
	]);
}

export const networkErr = function(err){
	if(err.message === 'Network Error'){
		return Toast.fail("请检查网络连接", 1);
	}
	alert(err);
}

export const stopPropagation = (e) => {
	if(Object.type(e) === Object.type.EVENT){
		if(e.stopPropagation){
			e.stopPropagation();
		}
	} else if (Object.type(e) === Object.type.OBJECT || Object.type(e) === Object.type.PROXYOBJECT){
		//Object.type(e) === Object.type.PROXYOBJECT兼容ios10，ios中获取react的事件对象解析为proxyobject，而不是object
		if(e.stopPropagation){
			e.stopPropagation();
		}
		if(e.nativeEvent&&e.nativeEvent.stopImmediatePropagation){
			if(e.nativeEvent.stopPropagation){
				e.nativeEvent.stopPropagation();
			}
			if(e.nativeEvent.stopImmediatePropagation){
				e.nativeEvent.stopImmediatePropagation();
			}
		}
	}
}

export const isNullOrEmpty = function(dealObj){
    var type = Object.type(dealObj);
    if(type.includes("html") || type.includes("element")){
        return false;
    }
    if(dealObj === undefined || dealObj === null || dealObj.toString() === "NaN" || dealObj === "" || dealObj.length === 0){
        return true;
    } else {
        if(Object.type(dealObj).includes("html")){
            return false;
        }
        if(Object.type(dealObj) === "object"){
            for(let key in dealObj){
                return false;
            }
            return true;
        }
    }
    return false;
}

export const calcSize = (size) => {
	let formatSize = "";
	if(size > 1073741824){
		formatSize = (size/1024/1024/1024).toFixed(2) + "GB";
	} else if(size > 1048576){
		formatSize = (size/1024/1024).toFixed(2) + "MB";
	} else if(size > 1024){
		formatSize = (size/1024).toFixed(2) + "KB";
	} else if(size < 1024){
		formatSize = size + "B";
	}
	return formatSize;
}