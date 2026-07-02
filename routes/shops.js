const express = require("express");
const { db, admin } = require("../config/firebase");
const { authenticate, authorize } = require("../middleware/auth");
const qrService = require("../services/qrService");

const router = express.Router();

/*
  Create Shop
  Role: admin
*/
router.post(
  "/",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const {
        shopName,
        ownerName,
        email,
        phone,
        address
      } = req.body;

      if (!shopName || !ownerName) {
        return res.status(400).json({
          success: false,
          message: "shopName and ownerName are required"
        });
      }

      const shopRef = db.collection("shops").doc();

      const qr = await qrService.generateShopQR(shopRef.id);

      const shopData = {
        shopId: shopRef.id,
        shopName,
        ownerName,
        email: email || "",
        phone: phone || "",
        address: address || "",
        status: "active",
        subscriptionStatus: "active",
        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp()
      };

      await shopRef.set(shopData);

      return res.status(201).json({
        success: true,
        shop: shopData,
        qr
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
|--------------------------------------------------------------------------
| Get Available Printers
|--------------------------------------------------------------------------
*/

router.get(
  "/:shopId/printers",
  async (req, res) => {

    try {

      const { exec } = require("child_process");

      exec(

        "lpstat -p",

        (error, stdout) => {

          if (error) {

            return res.json({

              success: true,

              printers: []

            });

          }

          const printers = stdout

            .split("\n")

            .filter(

              line => line.startsWith(

                "printer"

              )

            )

            .map(

              line => line.split(" ")[1]

            );

          return res.json({

            success: true,

            printers

          });

        }

      );

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
  Get Shop
*/
router.get("/:shopId", async (req, res) => {
  try {
    const shopDoc = await db
      .collection("shops")
      .doc(req.params.shopId)
      .get();

    if (!shopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Shop not found"
      });
    }

    return res.json({
      success: true,
      shop: shopDoc.data()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/*
  Shop Dashboard Summary
*/
router.get(
  "/:shopId/dashboard",
  async (req, res) => {
    try {
      const { shopId } = req.params;

      const ordersSnapshot = await db
        .collection("orders")
        .where("shopId", "==", shopId)
        .get();

      let revenue = 0;

      ordersSnapshot.forEach(doc => {
        const order = doc.data();

        if (order.paymentStatus === "paid") {
          revenue += Number(order.amount || 0);
        }
      });

      return res.json({
        success: true,
        totalOrders: ordersSnapshot.size,
        revenue
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
|--------------------------------------------------------------------------
| Save Printer Selection
|--------------------------------------------------------------------------
*/

router.patch(
"/:shopId/printer",

async(req,res)=>{

try{

const { shopId } = req.params;

const {

printerName,

printMode

} = req.body;

await db

.collection("shops")

.doc(shopId)

.set(

{

printerName,

printMode

},

{

merge:true

}

);

res.json({

success:true,

message:

"Printer Saved"

});

}

catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

}

);


module.exports = router;
