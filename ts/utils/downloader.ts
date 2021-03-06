export default function download(data: Blob, filename: string = "untitled") {
    let a = document.createElement("a");
    a.style.display = "none";
    let url = URL.createObjectURL(data);
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function downloadJSON(data: object, filename: string = "untitled.json") {
    download(new Blob([JSON.stringify(data, null, 4)], {
        type: "application/json"
    }), filename);
}