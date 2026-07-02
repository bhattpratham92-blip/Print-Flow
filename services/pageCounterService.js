const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { v4: uuidv4 } = require("uuid");

class PageCounterService {
  async getPageCount(fileBuffer, originalName) {
    const extension = path
      .extname(originalName)
      .toLowerCase()
      .replace(".", "");

    if (extension === "pdf") {
      const pdf = await pdfParse(fileBuffer);
      return pdf.numpages;
    }

    if (
      extension === "docx" ||
      extension === "pptx" ||
      extension === "ppt"
    ) {
const result =
  await this.countOfficePages(
    fileBuffer,
    extension
  );

return result;
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

  async countOfficePages(
    fileBuffer,
    extension
  ) {
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

    const officePath = path.join(
      tempDir,
      `${id}.${extension}`
    );

    fs.writeFileSync(
      officePath,
      fileBuffer
    );

    const previewDir = path.join(
 process.cwd(),
 "uploads",
 "previews"
);

if(!fs.existsSync(previewDir)){
 fs.mkdirSync(previewDir,{
   recursive:true
 });
}

    execSync(
`/Applications/LibreOffice.app/Contents/MacOS/soffice \
--headless \
--convert-to pdf \
--outdir "${previewDir}" \
"${officePath}"`
);



const pdfPath = path.join(
 previewDir,
 `${id}.pdf`
);

    const pdfBuffer =
      fs.readFileSync(pdfPath);

    const pdf =
      await pdfParse(pdfBuffer);

try {
   fs.unlinkSync(officePath);
} catch(e){}

return {
   pages: pdf.numpages,
   previewUrl: `/previews/${id}.pdf`
};
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