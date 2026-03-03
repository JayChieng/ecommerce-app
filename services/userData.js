import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

// ---------- ADDRESSES ----------
export const getAddresses = async (uid) => {
  const ref = collection(db, "users", uid, "addresses");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
};

export const addAddress = async (uid, data) => {
  const ref = collection(db, "users", uid, "addresses");
  await addDoc(ref, { ...data, createdAt: serverTimestamp() });
};

export const updateAddress = async (uid, id, data) => {
  const ref = doc(db, "users", uid, "addresses", id);
  await updateDoc(ref, data);
};

export const deleteAddress = async (uid, id) => {
  const ref = doc(db, "users", uid, "addresses", id);
  await deleteDoc(ref);
};

// ---------- PAYMENT METHODS ----------
export const getPaymentMethods = async (uid) => {
  const ref = collection(db, "users", uid, "paymentMethods");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addPaymentMethod = async (uid, data) => {
  const ref = collection(db, "users", uid, "paymentMethods");
  await addDoc(ref, { ...data, createdAt: serverTimestamp() });
};

export const updatePaymentMethod = async (uid, id, data) => {
  const ref = doc(db, "users", uid, "paymentMethods", id);
  await updateDoc(ref, data);
};

export const deletePaymentMethod = async (uid, id) => {
  const ref = doc(db, "users", uid, "paymentMethods", id);
  await deleteDoc(ref);
};

// ---------- WISHLIST ----------
export const addToWishlist = async (uid, product) => {
  if (!uid || !product?.id) return;

  const ref = doc(db, "users", uid, "wishlist", product.id);

  await setDoc(
    ref,
    {
      productId: product.id,
      name: product.name || "",
      price: Number(product.price || 0),
      imageUrl: product.imageUrl || null,
      addedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const removeFromWishlist = async (uid, productId) => {
  if (!uid || !productId) return;
  const ref = doc(db, "users", uid, "wishlist", productId);
  await deleteDoc(ref);
};

export const getWishlist = async (uid) => {
  const ref = collection(db, "users", uid, "wishlist");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// realtime: use for heart icon, wishlist screen, profile count
export const listenWishlist = (uid, cb) => {
  if (!uid) return () => {};

  const ref = collection(db, "users", uid, "wishlist");
  const q = query(ref, orderBy("addedAt", "desc"));

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(list);
  });
};

// realtime count: use for profile
export const listenWishlistCount = (uid, cb) => {
  if (!uid) return () => {};
  const ref = collection(db, "users", uid, "wishlist");
  return onSnapshot(ref, (snap) => cb(snap.size));
};