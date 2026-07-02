const cron = require("node-cron");

const { db, admin } = require("../config/firebase");
const logger = require("../config/logger");

/*
  Runs daily at midnight

  Detects:
  - expired subscriptions
  - suspended shops
*/

const startSubscriptionJob = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      logger.info(
        "Subscription validation job started"
      );

      const snapshot = await db
        .collection("shops")
        .get();

      const now = new Date();

      let expiredCount = 0;

      for (const doc of snapshot.docs) {
        const shop = doc.data();

        if (!shop.subscriptionExpiry) {
          continue;
        }

        const expiryDate =
          typeof shop.subscriptionExpiry.toDate ===
          "function"
            ? shop.subscriptionExpiry.toDate()
            : new Date(shop.subscriptionExpiry);

        if (expiryDate > now) {
          continue;
        }

        await doc.ref.update({
          subscriptionStatus: "expired",
          status: "suspended",
          updatedAt:
            admin.firestore.FieldValue.serverTimestamp()
        });

        expiredCount++;
      }

      logger.info(
        `Subscription validation completed. Expired shops: ${expiredCount}`
      );
    } catch (error) {
      logger.error(
        `Subscription job error: ${error.message}`
      );
    }
  });

  logger.info(
    "Subscription scheduler initialized"
  );
};

module.exports = {
  startSubscriptionJob
};