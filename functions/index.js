const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.onReviewWrite = functions.firestore
  .document("products/{productId}/reviews/{userId}")
  .onWrite(async (change, context) => {
    const { productId } = context.params;

    const reviewsSnap = await admin
      .firestore()
      .collection("products")
      .doc(productId)
      .collection("reviews")
      .get();

    let count = 0;
    let sum = 0;

    reviewsSnap.forEach((doc) => {
      const r = doc.data();
      const rating = Number(r.rating || 0);
      if (rating >= 1 && rating <= 5) {
        count++;
        sum += rating;
      }
    });

    const avg = count === 0 ? 0 : sum / count;

    await admin.firestore().collection("products").doc(productId).update({
      ratingAvg: Number(avg.toFixed(2)),
      ratingCount: count,
      ratingUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
