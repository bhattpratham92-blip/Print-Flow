const { db, admin } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

class OrderService {

async createOrder(orderData){

const orderId = uuidv4();

const order = {

orderId,

shopId: orderData.shopId,

customerName:
orderData.customerName || "Guest",

originalFileName:
orderData.originalFileName,

fileId:
orderData.fileId,

storagePath:
orderData.storagePath,

copies:
orderData.copies || 1,

colorMode:
orderData.colorMode || "bw",

paperSize:
orderData.paperSize || "A4",

duplex:
orderData.duplex || false,

amount:
orderData.amount || 0,

pages:
orderData.pages || 0,

fromPage:
orderData.fromPage || 1,

toPage:
orderData.toPage || 1,

selectedPages:
orderData.selectedPages || 1,

paymentStatus:
"pending",

status:
"created",

locked:
false,

createdAt:
admin.firestore.FieldValue.serverTimestamp(),

updatedAt:
admin.firestore.FieldValue.serverTimestamp()

};

await db
.collection("orders")
.doc(orderId)
.set(order);

return order;

}

async updateStatus(orderId,status){

await db
.collection("orders")
.doc(orderId)
.update({

status,

updatedAt:
admin.firestore.FieldValue.serverTimestamp()

});

return true;

}

async markPrinted(orderId){

await db
.collection("orders")
.doc(orderId)
.update({

status:
"printed",

printedAt:
admin.firestore.FieldValue.serverTimestamp(),

updatedAt:
admin.firestore.FieldValue.serverTimestamp()

});

return true;

}

async lockOrder(orderId,agentId){

await db
.collection("orders")
.doc(orderId)
.update({

locked:true,

lockedBy:
agentId || "agent",

lockedAt:
admin.firestore.FieldValue.serverTimestamp(),

status:
"printing",

updatedAt:
admin.firestore.FieldValue.serverTimestamp()

});

return true;

}

async getPendingOrders(shopId){

const snapshot =
await db
.collection("orders")
.where("shopId","==",shopId)
.where("paymentStatus","==","paid")
.get();

return snapshot.docs
.map(doc=>({

id:doc.id,

...doc.data()

}))

.filter(order=>

order.status==="pending"

||

order.status==="queued"

);

}

async getHistory(shopId){

const snapshot =
await db
.collection("orders")
.where("shopId","==",shopId)
.orderBy("createdAt","desc")
.get();

return snapshot.docs.map(doc=>({

id:doc.id,

...doc.data()

}));

}

async deleteOrder(orderId){

await db
.collection("orders")
.doc(orderId)
.delete();

return true;

}

async clearHistory(shopId){

const snapshot =
await db
.collection("orders")
.where("shopId","==",shopId)
.get();

const batch =
db.batch();

snapshot.docs.forEach(doc=>{

batch.delete(doc.ref);

});

await batch.commit();

return true;

}

}

module.exports =
new OrderService();