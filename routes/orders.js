const express = require("express");
const multer = require("multer");
const crypto = require("crypto");

const { db, admin } = require("../config/firebase");
const { authenticate, authorize } = require("../middleware/auth");
const { uploadLimiter } = require("../middleware/security");

const storageService = require("../services/storageService");
const orderService = require("../services/orderService");
const pageCounterService = require("../services/pageCounterService");
const fs = require("fs");
const path = require("path");

const {
  convertToPDF
} = require(
  "../services/documentConverter"
);

const router = express.Router();

const allowed = [

".pdf",

".doc",

".docx",

".ppt",

".pptx",

".jpg",

".jpeg",

".png"

];

const upload = multer({

storage:

multer.memoryStorage(),

limits:{

fileSize:

50*1024*1024

},

fileFilter:(req,file,cb)=>{

const extension =

path.extname(

file.originalname

).toLowerCase();

if(

allowed.includes(

extension

)

){

cb(null,true);

}

else{

cb(

new Error(

"File type not allowed"

)

);

}

}

});
/*
  Get Page Count
*/
router.post(
  "/page-count",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "File is required"
        });
      }

const result =
await pageCounterService.getPageCount(
    req.file.buffer,
    req.file.originalname
);

return res.json({

   success:true,

   pages:
   result.pages ||

   result,

   previewUrl:
   result.previewUrl ||

   null

});
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/*
  Create Order
*/
router.post(
  "/",
  uploadLimiter,
  upload.single("file"),
  async (req, res) => {
    try {
const {
 customerName,
 copies,
 colorMode,
 paperSize,
 duplex,
 fromPage,
 toPage
} = req.body;

const activeShopId = "testshop";

console.log(
"ACTIVE SHOP:",
activeShopId
);



      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "File is required"
        });
      }

const uploadedFile =
  await storageService.uploadFile(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

let pageBuffer =
  req.file.buffer;

let pageFileName =
  req.file.originalname;

const extension =
  path.extname(
    req.file.originalname
  ).toLowerCase();

if (
  extension === ".doc" ||
  extension === ".docx" ||
  extension === ".ppt" ||
  extension === ".pptx"
) {

  console.log(
    "Converting Office document to PDF..."
  );

  const pdfPath =
    await convertToPDF(
      uploadedFile.storagePath
    );

  pageBuffer =
    fs.readFileSync(
      pdfPath
    );

  pageFileName =
    path.basename(
      pdfPath
    );

  console.log(
    "Converted PDF:",
    pageFileName
  );

}

const pageInfo =
await pageCounterService.getPageCount(
 pageBuffer,
 pageFileName
);

const pages =
pageInfo.pages || pageInfo;

const previewUrl =
pageInfo.previewUrl || null;

const startPage =
  Number(fromPage || 1);

const endPage =
  Number(toPage || pages);

const selectedPages =
  endPage -
  startPage +
  1;

const calculatedAmount =
  pageCounterService.calculatePrice(
    selectedPages,
    Number(copies || 1),
    colorMode
  );

console.log(
  "Actual PDF Pages:",
  pages
);

console.log(
  "Start:",
  startPage
);

console.log(
  "End:",
  endPage
);

console.log(
  "Selected:",
  selectedPages
);

console.log(
  "Copies:",
  Number(copies || 1)
);

console.log(
  "Color:",
  colorMode
);

console.log(
  "Amount:",
  calculatedAmount
);

console.log(
  "File:",
  req.file.originalname
);

      const order =
await orderService.createOrder({

shopId: activeShopId,
          customerName,
          originalFileName:
req.file.originalname,
          copies: Number(copies || 1),
          colorMode,
          paperSize,
          duplex: duplex === "true",
amount: calculatedAmount,
pages,
fromPage: startPage,
toPage: endPage,
selectedPages,
          fileId: uploadedFile.fileId,
          storagePath: uploadedFile.storagePath
        });
        console.log("ORDER SAVED:", order.orderId);

    return res.status(201).json({
  success: true,
  order,
  totalPages: pages,
  calculatedAmount
});
  } catch (error) {
  console.error("ORDER ERROR:", error);

  return res.status(500).json({
    success: false,
    message: error.message
  });
}
  }
);

/*
|--------------------------------------------------------------------------
| Secure File Download For Electron Agent
|--------------------------------------------------------------------------
*/

router.get(

"/files/:orderId",

(req,res,next)=>{

const secret =
req.headers["x-agent-secret"];

if (

!secret ||

secret !== process.env.AGENT_SECRET

){

return res.status(401).json({

success:false,

message:"Unauthorized"

});

}

next();

},

async (req,res)=>{

try{

const orderDoc =
await db
.collection("orders")
.doc(req.params.orderId)
.get();

if(

!orderDoc.exists

){

return res.status(404).json({

success:false,

message:"Order not found"

});

}

const order =
orderDoc.data();

if(

!order.storagePath ||

!fs.existsSync(

order.storagePath

)

){

return res.status(404).json({

success:false,

message:"File not found"

});

}

return res.download(

order.storagePath

);

}

catch(error){

return res.status(500).json({

success:false,

message:error.message

});

}

}

);
 /*
|--------------------------------------------------------------------------
| Queue Orders
|--------------------------------------------------------------------------
*/

router.get(
  "/shop/:shopId/queue",
  async (req, res) => {
    try {

      const orders =
        await orderService.getPendingOrders(
          req.params.shopId
        );

      return res.json({

        success:true,

        count:orders.length,

        orders

      });

    }

    catch(error){

      return res.status(500).json({

        success:false,

        message:error.message

      });

    }

  }
);


/*
|--------------------------------------------------------------------------
| Update Status
|--------------------------------------------------------------------------
*/

router.patch(
  "/:orderId/status",

  async (req,res)=>{

    try{

      const { status } = req.body;

      if(!status){

        return res.status(400).json({

          success:false,

          message:"status is required"

        });

      }

      await orderService.updateStatus(

        req.params.orderId,

        status

      );

      return res.json({

        success:true,

        message:"Status updated"

      });

    }

    catch(error){

      return res.status(500).json({

        success:false,

        message:error.message

      });

    }

  }

);


/*
|--------------------------------------------------------------------------
| Mark Printed
|--------------------------------------------------------------------------
*/

router.patch(

"/:orderId/printed",

async (req,res)=>{

try{

await orderService.markPrinted(

req.params.orderId

);

await db

.collection("orders")

.doc(req.params.orderId)

.update({

deleteAfter:

Date.now()

+

Number(

process.env.FILE_DELETE_DELAY_HOURS || 24

)

*

60

*

60

*

1000,

updatedAt:

admin.firestore.FieldValue.serverTimestamp()

});

return res.json({

success:true,

message:"Order marked as printed"

});

}

catch(error){

return res.status(500).json({

success:false,

message:error.message

});

}

}

);
/*
|--------------------------------------------------------------------------
| Order History
|--------------------------------------------------------------------------
*/

router.get(
  "/shop/:shopId/history",
  async (req, res) => {

    try {

      const orders =
        await orderService.getHistory(
          req.params.shopId
        );

      return res.json({

        success: true,

        count: orders.length,

        orders

      });

    }

    catch (error) {

      return res.status(500).json({

        success: false,

        message: error.message

      });

    }

  }
);


/*
|--------------------------------------------------------------------------
| Delete Order
|--------------------------------------------------------------------------
*/

router.delete(
  "/:orderId",
  async (req, res) => {

    try {

      await orderService.deleteOrder(

        req.params.orderId

      );

      return res.json({

        success: true,

        message:
          "Order deleted"

      });

    }

    catch(error){

      return res.status(500).json({

        success:false,

        message:error.message

      });

    }

  }
);


/*
|--------------------------------------------------------------------------
| Clear History
|--------------------------------------------------------------------------
*/

router.delete(
  "/shop/:shopId/history",
  async (req,res)=>{

    try{

      await orderService.clearHistory(

        req.params.shopId

      );

      return res.json({

        success:true,

        message:

        "History cleared"

      });

    }

    catch(error){

      return res.status(500).json({

        success:false,

        message:error.message

      });

    }

  }

);
module.exports = router;