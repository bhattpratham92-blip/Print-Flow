

const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env")
});

const axios = require("axios");

console.log("QUEUE ENV:", process.env.AGENT_SECRET);
console.log("QUEUE MANAGER LOADED");

const printer = require("./printer");

class QueueManager {
  constructor() {
    this.running = false;
    this.timer = null;
    this.retryMap = new Map();
  }

 async start() {
  console.log("QueueManager.start() called");

  if (this.running) return;

  this.running = true;

  const interval =
    Number(process.env.AGENT_POLL_INTERVAL) || 10000;

  console.log("Polling every", interval, "ms");

  await this.poll();

  this.timer = setInterval(
    () => this.poll(),
    interval
  );
}

  async poll() {
      console.log("POLL CALLED");
    try {
      const shopId =
        process.env.SHOP_ID;

const token = process.env.AGENT_SECRET;

      console.log("SHOP_ID:", shopId);
console.log("AGENT_SECRET:", token);
console.log("APP_URL:", process.env.APP_URL);

      if (!shopId || !token) {
        return;
      }

      const response = await axios.get(
        `${process.env.APP_URL}/api/orders/shop/${shopId}/queue`,
        {
          headers: {
            "x-agent-secret": process.env.AGENT_SECRET
          }
        }
      );

      const orders =
        response.data.orders || [];

        console.log("Orders found:", orders.length);

orders.forEach(order => {
  console.log(
    "Order:",
    order.orderId,
    order.status,
    order.paymentStatus
  );
});

for (const order of orders) {

if(
order.status !== "queued" &&
order.status !== "pending"
){
continue;
}

if(
order.paymentStatus &&
order.paymentStatus!=="paid"
) continue;

await this.processOrder(order);

}
    } catch (error) {
console.error("Queue polling failed");
console.error("Message:", error.message);
console.error("Code:", error.code);

if (error.response) {
  console.error("Status:", error.response.status);
  console.error("Data:", error.response.data);
}

if (error.config) {
  console.error("URL:", error.config.url);
}
    }
  }

async processOrder(order) {
  try {

    console.log("Entered processOrder()");
    console.log("Order ID:", order.orderId);

   await this.lockOrder(order.orderId);

    const extension =
order.originalFileName
? path.extname(order.originalFileName)
: ".pdf";

    console.log("Downloading file...");

    const filePath = await printer.downloadFile(
      `${process.env.APP_URL}/api/orders/files/${order.orderId}`,
      order.orderId,
      extension
    );

    console.log("Downloaded:", filePath);

console.log("Starting print...");

const success =
await printer.print(
filePath,
order.orderId
);

if(!success){

throw new Error(
"Printer failed"
);

}

console.log("Print complete");

await printer.cleanup(filePath);

console.log("File cleaned");

await axios.patch(
  `${process.env.APP_URL}/api/orders/${order.orderId}/printed`,
  {},
  {
headers: {
  "x-agent-secret": process.env.AGENT_SECRET
}
  }
);

console.log("Marked as printed");

      this.retryMap.delete(
        order.orderId
      );
} catch (error) {

  console.error("PROCESS ORDER FAILED");
  console.error("Order:", order.orderId);
  console.error("Message:", error.message);

  if (error.response) {
    console.error("Status:", error.response.status);
    console.error("Data:", error.response.data);
  }

  console.error(error.stack);

  const retries =
    this.retryMap.get(order.orderId) || 0;

  this.retryMap.set(
    order.orderId,
    retries + 1
  );

  if (retries >= 3) {
    await this.markFailed(order.orderId);
  }
}
  }

async lockOrder(orderId) {
  try {
    console.log("\n========== LOCK ORDER ==========");
    console.log("Order ID:", orderId);
    console.log("APP_URL:", process.env.APP_URL);
    console.log("SHOP_ID:", process.env.SHOP_ID);

const token = process.env.AGENT_SECRET;

    console.log("Token exists:", !!token);
    console.log("Token length:", token ? token.length : 0);

    if (token) {
      console.log(
        "Token preview:",
        token.substring(0, 20) + "..." + token.substring(token.length - 10)
      );
    }

    const url = `${process.env.APP_URL}/api/orders/${orderId}/status`;

    console.log("PATCH URL:", url);
    console.log("Request Body:", {
      status: "printing"
    });

    const response = await axios.patch(
      url,
      {
        status: "printing"
      },
      {
        headers: {
           "x-agent-secret": process.env.AGENT_SECRET
        }
      }
    );

    console.log("✅ Order locked successfully");
    console.log("Status:", response.status);
    console.log("Response:", response.data);

  } catch (error) {
    console.error("\n========== LOCK ORDER FAILED ==========");
    console.error("Message:", error.message);

    if (error.response) {
      console.error("HTTP Status:", error.response.status);
      console.error("Response Data:", error.response.data);
    }

    if (error.config) {
      console.error("Request URL:", error.config.url);
     console.error("Headers:", error.config.headers);
    }

    throw error;
  }
}

async markFailed(orderId) {
  try {
    await axios.patch(
      `${process.env.APP_URL}/api/orders/${orderId}/status`,
      {
        status: "failed"
      },
      {
        headers: {
          "x-agent-secret": process.env.AGENT_SECRET
        }
      }
    );

    console.log("Order marked as failed:", orderId);

  } catch (error) {
    console.error("Unable to mark failed:", error.message);
  }
}
}
console.log("EXPORTING QUEUE MANAGER");
module.exports = new QueueManager();