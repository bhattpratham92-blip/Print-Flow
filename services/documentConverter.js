const { exec } = require("child_process");
const path = require("path");

async function convertToPDF(filePath) {

  return new Promise((resolve, reject) => {

    const fs = require("fs");

const previewDir =
path.join(
process.cwd(),
"uploads",
"previews"
);

if(!fs.existsSync(previewDir)){
fs.mkdirSync(
previewDir,
{recursive:true}
);
}

    const command =
      `soffice --headless \
--convert-to pdf \
"${filePath}" \
--outdir "${previewDir}"`;

    exec(command, (err, stdout, stderr) => {

      console.log("STDOUT:", stdout);

      console.log("STDERR:", stderr);

      if (err) {

        console.log(err);

        reject(err);

        return;

      }

const pdfName =
path.basename(
filePath
).replace(
 /\.[^/.]+$/,
 ".pdf"
);

const pdfPath =
path.join(
previewDir,
pdfName
);

      console.log(
        "PDF CREATED:",
        pdfPath
      );

      resolve(pdfPath);

    });

  });

}

module.exports = {

  convertToPDF

};