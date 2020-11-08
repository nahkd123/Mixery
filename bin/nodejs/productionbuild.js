/*
This NodeJS script will copy files to /temp/production
*/
import * as fs from "fs";
import * as path from "path";
const EXCLUDE_SOURCE_MAP = true;
function cleanSource(input) {
    const eolSequence = (/\r\n/g).test(input) ? "\r\n" : "\n";
    const inputLines = input.split(/\r\n|\n/g);
    const outputLines = [];
    for (let i = 0; i < inputLines.length; i++) {
        if ((!inputLines[i].trimStart().startsWith("//")) &&
            (inputLines[i].trim().length !== 0))
            outputLines.push(inputLines[i]);
    }
    ;
    return outputLines.join(eolSequence);
}
function copyDir(targetDir, destDir) {
    if (!fs.existsSync(destDir))
        fs.mkdirSync(destDir, { recursive: true });
    fs.readdirSync(targetDir).forEach(fileName => {
        const stat = fs.statSync(path.join(targetDir, fileName));
        if (stat.isFile()) {
            if (fileName.endsWith(".map"))
                return;
            if (fileName.endsWith(".js")) {
                const result = cleanSource(fs.readFileSync(path.join(targetDir, fileName), { encoding: "utf-8" }));
                fs.writeFileSync(path.join(destDir, fileName), result, { encoding: "utf-8" });
            }
            else
                fs.copyFileSync(path.join(targetDir, fileName), path.join(destDir, fileName));
        }
        else if (stat.isDirectory())
            copyDir(path.join(targetDir, fileName), path.join(destDir, fileName));
    });
}
function copy(targetFile, destDir) {
    fs.copyFileSync(targetFile, destDir);
}
function mkdir(path) {
    if (!fs.existsSync(path))
        fs.mkdirSync(path, { recursive: true });
}
function rmdir(path) {
    if (fs.existsSync(path))
        fs.rmdirSync(path, { recursive: true });
}
console.log("[build/production] Now performing production build...");
console.log("[build/production] Coping files...");
rmdir("./temp/production");
mkdir("./temp/production");
copyDir("./app", "./temp/production/app");
copyDir("./bin", "./temp/production/bin");
copyDir("./css", "./temp/production/css");
copyDir("./assets", "./temp/production/assets");
copy("./index.html", "./temp/production/index.html");
console.log("[build/production] Removing test assets...");
rmdir("./temp/production/assets/test-assets");
copy("./LICENSE", "./temp/production/LICENSE");
console.log("[build/production] Finished!");