const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { v4: uuidv4 } = require("uuid");

class PageCounterService {
  async getPageCount(fileBuffer, originalName) {
    const extension =
      path.extname(originalName)
        .toLowerCase()
        .replace(".", "");

    if (extension === "pdf") {
      const pdf = await pdfParse(fileBuffer);
      return pdf.numpages;
    }

    if (extension === "docx") {
      return await this.countDocxPages(
        fileBuffer
      );
    }

    if (
      extension === "jpg" ||
      extension === "jpeg" ||
      extension === "png"
    ) {
      return 1;
    }

    return 1;
  }

  async countDocxPages(fileBuffer) {
    const tempDir = path.join(
      process.cwd(),
      "temp"
    );

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, {
        recursive: true
      });
    }

    const id = uuidv4();

    const docxPath = path.join(
      tempDir,
      `${id}.docx`
    );

    fs.writeFileSync(
      docxPath,
      fileBuffer
    );

    execSync(
      `/Applications/LibreOffice.app/Contents/MacOS/soffice \
      --headless \
      --convert-to pdf \
      --outdir "${tempDir}" \
      "${docxPath}"`
    );

    const pdfPath = path.join(
      tempDir,
      `${id}.pdf`
    );

    const pdfBuffer =
      fs.readFileSync(pdfPath);

    const pdf =
      await pdfParse(pdfBuffer);

    try {
      fs.unlinkSync(docxPath);
      fs.unlinkSync(pdfPath);
    } catch (_) {}

    return pdf.numpages;
  }

  calculatePrice(
    pages,
    copies,
    colorMode
  ) {
    const rate =
      colorMode === "color"
        ? 10
        : 2;

    return pages * copies * rate;
  }
}

module.exports =
  new PageCounterService();