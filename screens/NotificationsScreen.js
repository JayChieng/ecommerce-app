import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase";
import {
  listenMyNotifications,
  markNotificationRead,
  clearAllMyNotifications,
} from "../services/notifications";

const formatTime = (date) => {
  if (!date) return "";
  try {
    return date.toLocaleString();
  } catch {
    return "";
  }
};

export default function NotificationsScreen({ navigation }) {
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);

  useEffect(() => {
    if (!uid) {
      setList([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = listenMyNotifications((items) => {
      setList(items);
      setLoading(false);
    });

    return () => unsub?.();
  }, [uid]);

  const unreadCount = useMemo(
    () => list.filter((x) => !x.read).length,
    [list]
  );

  const openNotification = async (item) => {
    // mark read first (UX)
    if (!item.read) {
      await markNotificationRead(item.id);
    }

    const orderId = item?.data?.orderId;
    if (orderId) {
      navigation.navigate("OrderTracking", { orderId });
    }
  };

  const renderItem = ({ item }) => {
    const createdAt =
      item?.createdAt?.toDate?.() ? item.createdAt.toDate() : null;

    return (
      <TouchableOpacity
        style={[styles.row, !item.read && styles.rowUnread]}
        onPress={() => openNotification(item)}
        activeOpacity={0.8}
      >
        <View style={styles.leftIcon}>
          <Ionicons
            name={item.read ? "notifications-outline" : "notifications"}
            size={20}
            color={item.read ? "#6B7280" : "#2563EB"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, !item.read && styles.titleUnread]}>
            {item.title || "Notification"}
          </Text>
          {!!item.body && <Text style={styles.body}>{item.body}</Text>}
          <Text style={styles.time}>{formatTime(createdAt)}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>
          Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ""}
        </Text>

        <TouchableOpacity
          onPress={clearAllMyNotifications}
          style={styles.clearBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={18} color="#B91C1C" />
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {list.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={28} color="#9CA3AF" />
          <Text style={{ marginTop: 10, color: "#6B7280" }}>
            No notifications yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerText: { fontSize: 16, fontWeight: "700", color: "#111827" },

  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  clearText: { marginLeft: 6, color: "#B91C1C", fontWeight: "700" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  rowUnread: {
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.25)",
  },
  leftIcon: { width: 34, alignItems: "center", marginRight: 8 },
  title: { fontSize: 14, fontWeight: "700", color: "#111827" },
  titleUnread: { color: "#1D4ED8" },
  body: { marginTop: 4, color: "#374151" },
  time: { marginTop: 6, fontSize: 12, color: "#9CA3AF" },
});
