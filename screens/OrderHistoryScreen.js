import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { auth } from "../firebase";
import { getOrdersForUser } from "../services/orders";

const OrderHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
  try {
    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      setOrders([]);
      return;
    }

    const list = await getOrdersForUser(user.uid);
    setOrders(list);
  } catch (err) {
    console.log("Error fetching orders:", err);
  } finally {
    setLoading(false);
  }
}, []);

useFocusEffect(
  useCallback(() => {
    fetchOrders();
  }, [fetchOrders])
);


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading orders...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#6B7280" }}>You have no orders yet.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const createdAt =
      item.createdAt?.toDate?.().toLocaleDateString() ?? "Unknown date";

    const itemsText = (item.items || [])
      .map((i) => `${i.name} x ${i.quantity}`)
      .join(", ");

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={styles.orderId}>Order #{item.id.slice(0, 6)}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {String(item.status || "placed").toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.dateText}>{createdAt}</Text>
        <Text style={styles.itemsText} numberOfLines={2}>
          {itemsText}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            ${Number(item.total || 0).toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => navigation.navigate("OrderTracking", { orderId: item.id })}
        >
          <Text style={styles.trackButtonText}>Track Order</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      />
    </View>
  );
};

export default OrderHistoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: { fontWeight: "700", fontSize: 15, color: "#111827" },
  statusBadge: {
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: "600", color: "#4B5563" },
  dateText: { fontSize: 12, color: "#6B7280", marginTop: 4, marginBottom: 8 },
  itemsText: { fontSize: 13, color: "#4B5563", marginBottom: 8 },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 14, color: "#111827" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#2563EB" },
  trackButton: {
    marginTop: 10,
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  trackButtonText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
  },
});
