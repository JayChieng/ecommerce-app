import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import {
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";

// Show alerts while app is foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ask permission + get token (Expo push token)
// Note: For Android, still must configure FCM in EAS for real push delivery.
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log("Must use a physical device for Push Notifications");
    return null;
  }

  // permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push permission not granted");
    return null;
  }

  // Get Expo push token
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId;

  const token = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  return token;
}

// Save token to Firestore
export async function saveMyPushToken(token) {
  const user = auth.currentUser;
  if (!user || !token) return;

  // store at users/{uid}/pushTokens/{token} so you can keep multiple devices
  const ref = doc(db, "users", user.uid, "pushTokens", token);

  await setDoc(
    ref,
    {
      token,
      platform: Device.osName || "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function sendPushToUser(userId, { title, body, data }) {
  if (!userId) {
    console.log("sendPushToUser: missing userId");
    return;
  }
  // Read all tokens of this user
  const tokensRef = collection(db, "users", userId, "pushTokens");
  const snap = await getDocs(tokensRef);

  const tokens = snap.docs.map((d) => d.id).filter(Boolean);
  if (tokens.length === 0) {
    console.log("No push tokens for user:", userId);
    return;
  }

  // Send to Expo Push API (demo approach)
  const messages = tokens.map((t) => ({
    to: t,
    title,
    body,
    data: data || {},
    sound: "default",
  }));

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages.length === 1 ? messages[0] : messages),
  });

  const json = await res.json();
  console.log("Push send result:", json);
}

// ---------- IN-APP NOTIFICATIONS (Firestore) ----------

// Create 1 notification for a user
export async function addInAppNotification(userId, { title, body, data, type }) {
  if (!userId) return;

  const ref = collection(db, "users", userId, "notifications");
  await addDoc(ref, {
    title: title || "Notification",
    body: body || "",
    type: type || "general",
    data: data || {},
    read: false,
    createdAt: serverTimestamp(),
  });
}

// Listen current user's notifications (realtime)
export function listenMyNotifications(cb) {
  const user = auth.currentUser;
  if (!user) return () => {};

  const ref = collection(db, "users", user.uid, "notifications");
  const q = query(ref, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(list);
  });
}

// Mark read
export async function markNotificationRead(notificationId) {
  const user = auth.currentUser;
  if (!user || !notificationId) return;

  const ref = doc(db, "users", user.uid, "notifications", notificationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  await updateDoc(ref, { read: true });
}

// Clear all
export async function clearAllMyNotifications() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = collection(db, "users", user.uid, "notifications");
  const snap = await getDocs(ref);

  const deletes = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletes);
}
