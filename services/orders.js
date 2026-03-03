import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { sendPushToUser, addInAppNotification } from "./notifications";

const ORDERS_COLLECTION = "orders";

// create new order
export const createOrder = async ({ userId, items, subtotal, tax, total }) => {
  const ref = collection(db, ORDERS_COLLECTION);

  const docRef = await addDoc(ref, {
    userId,
    items,          // cartItems array (name, price, quantity, imageUrl…)
    subtotal,
    tax,
    total,

    // ✅ status + timeline
    status: "placed",
    statusHistory: [{ status: "placed", at: Timestamp.now() }],

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

// get 1 user's order list 
export const getOrdersForUser = async (userId) => {
  const ref = collection(db, ORDERS_COLLECTION);

  const q = query(
    ref,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// get order by ID
export const getOrderById = async (orderId) => {
  const ref = doc(db, ORDERS_COLLECTION, orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};





// real time listener
export const listenOrderById = (orderId, callback) => {
  const ref = doc(db, ORDERS_COLLECTION, orderId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() });
  });
};

// ============= move order to next status & notification=========
export const advanceOrderStatusAndNotify = async (orderId) => {
  const ref = doc(db, ORDERS_COLLECTION, orderId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const order = snap.data();
  const current = order.status || "placed";

  const flow = ["placed", "confirmed", "shipped", "delivered"];
  const idx = flow.indexOf(current);
  const next = flow[Math.min(idx + 1, flow.length - 1)];

  // Update Firestore order
  const nextHistory = Array.isArray(order.statusHistory) ? [...order.statusHistory] : [];
  nextHistory.push({ status: next, at: Timestamp.now() });

  await updateDoc(ref, {
    status: next,
    statusHistory: nextHistory,
    updatedAt: serverTimestamp(),
  });


  // Send push to this order's owner
  const title = "Order update";
  const bodyMap = {
    confirmed: "Your order has been confirmed.",
    shipped: "Your order is on the way.",
    delivered: "Your order has been delivered.",
  };
  if (!order.userId) {
    console.log("[advance] order missing userId:", orderId);
    return next; // vẫn update status được, chỉ bỏ qua notify
  }

   // Save in-app notification for history screen
  await addInAppNotification(order.userId, {
    title: "Order update",
    body: bodyMap[next] || `Order status: ${next}`,
    type: "order",
    data: { orderId, status: next },
  });

  await sendPushToUser(order.userId, {
    title,
    body: bodyMap[next] || `Order status: ${next}`,
    data: { orderId, status: next },
  });
  return next;
};

