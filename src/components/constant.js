const host = "http://localhost:9527"
export const URL = {
    upload: host + "/Images",
    download:  host + "/src/Images/{filename}",
	delete:  host + "/delete_file/{filename}",
	getList:  host + "/get_list"
}
