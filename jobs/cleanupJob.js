const cron = require("node-cron");

const { db, admin } = require("../config/firebase");
const storageService = require("../services/storageService");
const logger = require("../config/logger");

/*
  Runs every 5 minutes

  Deletes files that:
  - were successfully printed
  - have passed deleteAfter timestamp
*/

const startCleanupJob = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      logger.info("Cleanup job started");

      const now = Date.now();

      const snapshot = await db
        .collection("orders")
        .where("status", "==", "printed")
        .get();

      let deletedCount = 0;

      for (const doc of snapshot.docs) {
        const order = doc.data();

        if (!order.deleteAfter) {
          continue;
        }

        if (order.deleteAfter > now) {
          continue;
        }

        try {
          if (order.storagePath) {
            await storageService.deleteFile(
              order.storagePath
            );
          }

          await doc.ref.update({
            fileDeleted: true,
            fileDeletedAt:
              admin.firestore.FieldValue.serverTimestamp(),
            storagePath: null,
            updatedAt:
              admin.firestore.FieldValue.serverTimestamp()
          });

          deletedCount++;
        } catch (error) {
          logger.error(
            `Cleanup failed for order ${doc.id}: ${error.message}`
          );
        }
      }

      logger.info(
        `Cleanup job completed. Deleted files: ${deletedCount}`
      );
    } catch (error) {
      logger.error(
        `Cleanup job error: ${error.message}`
      );
    }
  });

  logger.info("Cleanup scheduler initialized");
};

module.exports = {
  startCleanupJob
};