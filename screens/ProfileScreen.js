import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { getOrdersForUser } from "../services/orders";
import { pickAndUploadAvatar } from "../services/avatars";
import { listenWishlistCount } from "../services/userData";

import { Platform } from "react-native";

const ProfileScreen = ({ navigation }) => {
  const user = auth.currentUser;

  // profile from Firestore users/{uid}
const [profile, setProfile] = useState(null);

useEffect(() => {
  const uid = user?.uid;
  if (!uid) return;

  const ref = doc(db, "users", uid);
  const unsub = onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) setProfile(snap.data());
    },
    (err) => console.log("Error loading user profile", err)
  );

  return () => unsub();
}, [user?.uid]);

 const email = profile?.email || user?.email || "Guest";
  // Display name: prioritize displayName, if don't have use part before @ of email
  const nameFromEmail = email.includes("@") ? email.split("@")[0] : email;
  const displayName = user?.displayName || nameFromEmail || "Guest";

  // user photo if has (Firebase Auth)
  const photoURL = profile?.photoURL || user?.photoURL || null;

  // First letter in avatar frame if no photo
  const initials = displayName.charAt(0).toUpperCase();

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleChangeAvatar = async () => {
    if (uploadingAvatar) return;
    try {
      setUploadingAvatar(true);
      await pickAndUploadAvatar();
    } catch (e) {
      Alert.alert("Upload failed", e?.message || "Please try again");
    } finally {
      setUploadingAvatar(false);
    }
  };


  const [orderCount, setOrderCount] = useState(0);

  const reviewCount = profile?.reviewCount || 0;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadOrdersCount = async () => {
        if (!user) return;
        try {
          const list = await getOrdersForUser(user.uid);
          if (isActive) {
            setOrderCount(list.length);
          }
        } catch (e) {
          console.log("Error loading order count", e);
        }
      };

      loadOrdersCount();

      // cleanup when leave screen
      return () => {
        isActive = false;
      };
    }, [user])
  );

  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setWishlistCount(0);
      return;
    }

    const unsub = listenWishlistCount(uid, setWishlistCount);
    return () => unsub?.();
  }, [user?.uid]);


  const handleLogout = async () => {
    // Web
    if (Platform.OS === "web") {
      const ok = window.confirm("Are you sure you want to sign out?");
      if (!ok) return;

      try {
        await auth.signOut();
      } catch (e) {
        window.alert("Failed to sign out");
      }
      return;
    }

    // mobile
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await auth.signOut();
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          }
        },
      },
    ]);
  };

  const comingSoon = (title) => {
    Alert.alert("Coming soon", `${title} screen coming soon!`);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
    <View style={styles.container}>
      {/* Header gradient */}
      <LinearGradient
        colors={["#0e67ecff", "#34ebb4ff"]}
        style={styles.headerGradient}
      >
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.avatar}
          onPress={handleChangeAvatar}
          activeOpacity={0.8}
        >
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </TouchableOpacity>
      <View>
        <Text style={styles.nameText}>{displayName}</Text>
        <Text style={styles.subText}>{email}</Text>
      </View>
</View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{orderCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{wishlistCount}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
          <View style={styles.statItem}>
            <Text 
              style={styles.statNumber}>{profile?.reviewCount || 0}
            </Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Menu card */}
      <View style={styles.menuCard}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("OrderHistory")}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="bag-handle-outline" size={20} color="#2563EB" />
            <Text style={styles.menuLabel}>My Orders</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Wishlist")}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="heart-outline" size={20} color="#EC4899" />
            <Text style={styles.menuLabel}>Wishlist</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Address")}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="location-outline" size={20} color="#10B981" />
            <Text style={styles.menuLabel}>Addresses</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("PaymentMethods")}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="card-outline" size={20} color="#F59E0B" />
            <Text style={styles.menuLabel}>Payment Methods</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Notifications")}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="notifications-outline" size={20} color="#6366F1" />
            <Text style={styles.menuLabel}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("About")}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="information-circle-outline" size={20} color="#0ea5e9" />
            <Text style={styles.menuLabel}>About App</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("HelpSupport")}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="help-circle-outline" size={20} color="#6366F1" />
            <Text style={styles.menuLabel}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
  },
  nameText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subText: {
    fontSize: 13,
    color: "#E5E7EB",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 16,
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  statLabel: {
    color: "#E5E7EB",
    fontSize: 12,
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 4,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuLabel: {
    fontSize: 15,
    color: "#111827",
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  logoutText: {
    marginLeft: 6,
    color: "#B91C1C",
    fontWeight: "600",
  },
});
