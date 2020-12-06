export function upload(accepts: string = "") {
    return new Promise<FileList>((resolve, reject) => {
        let inp = document.createElement("input");
        inp.type = "file";
        inp.accept = accepts;
        inp.addEventListener("change", event => {
            resolve(inp.files);
        });
        inp.click();
    });
}