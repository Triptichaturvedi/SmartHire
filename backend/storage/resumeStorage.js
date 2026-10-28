const fs = require("fs");
const path = require("path");

class LocalPrivateResumeStorage {
  constructor(directory = path.join(__dirname, "..", "private-uploads")) {
    this.directory = path.resolve(directory);
    fs.mkdirSync(this.directory, { recursive: true });
  }

  pathFor(filename) {
    return path.join(this.directory, path.basename(filename));
  }

  exists(filename) {
    return fs.existsSync(this.pathFor(filename));
  }

  remove(filename) {
    const filePath = this.pathFor(filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

if (process.env.RESUME_STORAGE && process.env.RESUME_STORAGE !== "local") {
  throw new Error("Only RESUME_STORAGE=local is configured. Add a private storage adapter before selecting another provider.");
}

module.exports = new LocalPrivateResumeStorage(process.env.RESUME_STORAGE_DIR);
