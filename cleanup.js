const fs = require("fs");
const path = require("path");

const oldPath = path.join(
  __dirname,
  "src",
  "app",
  "api",
  "github",
  "repositories",
  "[owner]"
);

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

try {
  deleteFolderRecursive(oldPath);
  console.log("Successfully removed old directory structure");
} catch (error) {
  console.error("Error removing directory:", error);
}
