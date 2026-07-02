const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

class Printer {
  constructor() {
    this.tempDir = path.join(
      process.cwd(),
      "print-jobs"
    );

    this.virtualPrintDir = path.join(
      process.cwd(),
      "printed-orders"
    );

    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, {
        recursive: true
      });
    }

    if (!fs.existsSync(this.virtualPrintDir)) {
      fs.mkdirSync(this.virtualPrintDir, {
        recursive: true
      });
    }

    this.printMode =
      process.env.PRINT_MODE || "virtual";
      this.printerName =
  process.env.PRINTER_NAME || ""; 
  }

async getPrinters(){

return new Promise(

(resolve)=>{

const command =

process.platform==="win32"

?

"wmic printer get name"

:

"lpstat -p";

exec(

command,

(error,stdout)=>{

if(error){

resolve([]);

return;

}

let printers = [];

if(

process.platform==="win32"

){

printers = stdout

.split("\n")

.slice(1)

.map(

p=>p.trim()

)

.filter(Boolean);

}

else{

printers = stdout

.split("\n")

.filter(

line=>

line.startsWith(

"printer"

)

)

.map(

line=>

line.split(" ")[1]

);

}

resolve(

printers

);

}

);

}

);

}

  async downloadFile(
    url,
    orderId,
    extension = ".pdf"
  ) {
    const filePath = path.join(
      this.tempDir,
      `${orderId}${extension}`
    );

    const response = await axios({
      method: "GET",
      url,
      responseType: "stream"
    });

    await new Promise((resolve, reject) => {
      const writer =
        fs.createWriteStream(filePath);

      response.data.pipe(writer);

      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    return filePath;
  }

 async print(filePath, orderId){

if(

this.printMode==="virtual"

){

return this.virtualPrint(

filePath,

orderId

);

}

return this.physicalPrint(

filePath

);

}

  async virtualPrint(filePath, orderId) {
    const extension =
      path.extname(filePath);

    const destination = path.join(
      this.virtualPrintDir,
      `${orderId}${extension}`
    );

    await fs.promises.copyFile(
      filePath,
      destination
    );

    console.log(
      "Virtual print complete:",
      destination
    );

    return true;
  }
 async physicalPrint(filePath){

return new Promise(

(resolve,reject)=>{

let command = "";

if(

process.platform==="win32"

){

command =

`powershell Start-Process -FilePath "${filePath}" -Verb Print`;

}

else{

command =

this.printerName

?

`lp -d "${this.printerName}" "${filePath}"`

:

`lp "${filePath}"`;

}

exec(

command,

(error)=>{

if(error){

console.log(

"Printer Error",

error

);

reject(false);

return;

}

console.log(

"Printed Successfully:",

filePath

);

resolve(true);

}

);

}

);

}

  async cleanup(filePath) {
    try {
      await fs.promises.unlink(filePath);
    } catch (_) {}
  }
}

module.exports = new Printer();
