export const domain = "localhost:9527"
const host = `http://${domain}`;
export const URL = {
    upload: host + "/Images",
    download:  host + "/src/Images/{filename}",
	delete:  host + "/delete_file/{filename}",
	getList:  host + "/get_list"
}
