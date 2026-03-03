import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase";
import { listenWishlist, removeFromWishlist } from "../services/userData";

const WishlistScreen = ({ navigation }) => {
  const user = auth.currentUser;
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    const unsub = listenWishlist(user.uid, setItems);
    return () => unsub?.();
  }, [user?.uid]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons name="heart-outline" size={72} color="#E5E7EB" />
        <Text style={styles.title}>Please login to use Wishlist</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="heart-outline" size={72} color="#E5E7EB" />
        <Text style={styles.title}>Your Wishlist is Empty</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={styles.name}>
          {item.name}
        </Text>
        <Text style={styles.price}>
          ${Number(item.price || 0).toFixed(2)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() =>
          Alert.alert("Remove item", "Remove this item from wishlist?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Remove",
              style: "destructive",
              onPress: async () => {
                try {
                  await removeFromWishlist(user.uid, item.productId);
                } catch (e) {
                  Alert.alert("Error", e?.message || "Could not remove item.");
                }
              },
            },
          ])
        }
        style={{ padding: 6 }}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      />
    </View>
  );
};

export default WishlistScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  center: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111827", marginTop: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  image: { width: 56, height: 56, borderRadius: 12, marginRight: 12 },
  imagePlaceholder: { backgroundColor: "#E5E7EB" },
  name: { fontSize: 14, fontWeight: "600", color: "#111827" },
  price: { marginTop: 6, fontSize: 14, fontWeight: "700", color: "#2563EB" },
});

