import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { listenOrderById, advanceOrderStatusAndNotify } from "../services/orders";

const STEPS = ["placed", "confirmed", "shipped", "delivered"];

const labelOf = (s) => {
  if (s === "placed") return "Placed";
  if (s === "confirmed") return "Confirmed";
  if (s === "shipped") return "Shipped";
  if (s === "delivered") return "Delivered";
  return s;
};

const OrderTrackingScreen = ({ route }) => {
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

//   realtime listener
  useEffect(() => {
    setLoading(true);
    const unsub = listenOrderById(orderId, (o) => {
        setOrder(o);
        setLoading(false);
    });

    return () => unsub?.();
  }, [orderId]);

  const historyMap = useMemo(() => {
    const map = new Map();
    (order?.statusHistory || []).forEach((h) => {
      const at = h?.at?.toDate?.() ? h.at.toDate() : null;
      if (h?.status && !map.has(h.status)) map.set(h.status, at);
    });
    return map;
  }, [order?.statusHistory]);

  const currentIdx = Math.max(0, STEPS.indexOf(order?.status || "placed"));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading tracking...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#6B7280" }}>Order not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Order #{String(order.id).slice(0, 6)}</Text>
        <Text style={styles.subtitle}>
          Current status: <Text style={styles.bold}>{labelOf(order.status || "placed")}</Text>
        </Text>

        <View style={{ marginTop: 14 }}>
          {STEPS.map((step, idx) => {
            const done = idx <= currentIdx;
            const at = historyMap.get(step);
            const timeText = at ? at.toLocaleString() : "—";

            return (
              <View key={step} style={styles.row}>
                <View style={styles.leftCol}>
                  <View style={[styles.dot, done ? styles.dotDone : styles.dotTodo]}>
                    <Ionicons
                      name={done ? "checkmark" : "ellipse-outline"}
                      size={14}
                      color={done ? "#FFFFFF" : "#9CA3AF"}
                    />
                  </View>
                  {idx !== STEPS.length - 1 && (
                    <View style={[styles.line, done ? styles.lineDone : styles.lineTodo]} />
                  )}
                </View>

                <View style={styles.rightCol}>
                  <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>
                    {labelOf(step)}
                  </Text>
                  <Text style={styles.stepTime}>{timeText}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ✅ Demo button to simulate status changes */}
        <TouchableOpacity
          style={[styles.advanceBtn, updating && { opacity: 0.6 }]}
          disabled={updating}
          onPress={async () => {
            try {
                setUpdating(true);

                const next = await advanceOrderStatusAndNotify(order.id);

                Alert.alert(
                "Advance OK",
                `Old: ${order?.status || "placed"}\nNext: ${next || "?"}`
                );
            } catch (e) {
                Alert.alert("Advance FAILED", e?.message || String(e));
            } finally {
                setUpdating(false);
            }
          }}
        >
          <Text style={styles.advanceText}>
            {order.status === "delivered" ? "Delivered ✅" : "Advance to next status (demo)"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrderTrackingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6" },

  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16 },
  title: { fontSize: 16, fontWeight: "800", color: "#111827" },
  subtitle: { marginTop: 6, color: "#4B5563" },
  bold: { fontWeight: "800", color: "#111827" },

  row: { flexDirection: "row" },
  leftCol: { width: 32, alignItems: "center" },
  rightCol: { flex: 1, paddingBottom: 14 },

  dot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  dotDone: { backgroundColor: "#10B981" },
  dotTodo: { backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#D1D5DB" },

  line: { width: 2, flex: 1, marginTop: 4, borderRadius: 2 },
  lineDone: { backgroundColor: "#10B981" },
  lineTodo: { backgroundColor: "#E5E7EB" },

  stepLabel: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
  stepLabelDone: { color: "#111827" },
  stepTime: { marginTop: 2, fontSize: 12, color: "#9CA3AF" },

  advanceBtn: {
    marginTop: 12,
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  advanceText: { color: "#FFFFFF", fontWeight: "800" },
});
