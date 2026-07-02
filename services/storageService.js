const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

class StorageService {
  constructor() {
    this.uploadDir = path.join(
      process.cwd(),
      "uploads"
    );

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, {
        recursive: true
      });
    }
  }

  async uploadFile(
    fileBuffer,
    originalName,
    mimeType
  ) {
    const fileId = uuidv4();

const extension =
path.extname(originalName)
|| ".pdf";

    const fileName =
      `${fileId}${extension}`;

    const storagePath =
      path.join(
        this.uploadDir,
        fileName
      );

    await fs.promises.writeFile(
      storagePath,
      fileBuffer
    );

    return {
      fileId,
      storagePath,
      originalName,
      mimeType
    };
  }

  async generateSignedUrl(
    storagePath
  ) {
    return storagePath;
  }

  async deleteFile(
    storagePath
  ) {
    try {
      await fs.promises.unlink(
        storagePath
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  async fileExists(
    storagePath
  ) {
    return fs.existsSync(
      storagePath
    );
  }
}

module.exports =
  new StorageService();