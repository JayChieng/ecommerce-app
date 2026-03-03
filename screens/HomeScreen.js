import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { collection, onSnapshot } from "firebase/firestore";
import { db,  auth } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import {
  listenWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../services/userData";

  const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [isGrid, setIsGrid] = useState(true); // true = 2 columns, false = 1 column

  // FETCH PRODUCTS FROM FIRESTORE
  //  FIX: realtime products listener (ratingAvg/ratingCount auto update)
  useEffect(() => {
    const colRef = collection(db, "products");

    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.log("Error fetching products:", err);
        setError("Failed to load products");
        setLoading(false);
      }
    );

    // cleanup -> leave Homescreen-> app unmount -> react call this function -> disconnect Firestore realtime -> prevent memory leak, dublicate update, lagging
    return () => unsub();
  }, []);

  // Add state wishlistIds + listener
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setWishlistIds(new Set());
      return;
    }

    const unsub = listenWishlist(uid, (list) => {
      setWishlistIds(new Set(list.map((x) => x.productId)));
    });

    return () => unsub?.();
  }, []);



  // FILTER + SORT
  const visibleProducts = useMemo(() => {
    let list = [...products];

    // filter by category
    if (selectedCategory !== "All") {
      list = list.filter(
        (p) =>
          p.category &&
          p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // search by name
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) =>
        (p.name || "").toLowerCase().includes(q)
      );
    }

    // sort
    list.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      const pa = Number(a.price || 0);
      const pb = Number(b.price || 0);
      return pa - pb;
    });

    return list;
  }, [products, selectedCategory, search, sortBy]);

  // RENDER
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }) => {
    const rating = Number(item.ratingAvg || 0);
    const count = Number(item.ratingCount || 0);

    const isWished = wishlistIds.has(item.id);

    const toggleWish = async () => {
      const u = auth.currentUser;
      if (!u) {
        Alert.alert("Login required", "Please login to use Wishlist.");
        return;
      }

      try {
        if (isWished) await removeFromWishlist(u.uid, item.id);
        else await addToWishlist(u.uid, item);
      } catch (e) {
        Alert.alert("Error", e?.message || "Could not update wishlist.");
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isGrid && styles.cardGrid,
          isGrid && index % 2 === 0 && { marginRight: 8 },
        ]}
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
        activeOpacity={0.85}
      >
        {/* photo + heart */}
        <View style={{ position: "relative" }}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <Text style={styles.cardImagePlaceholderText}>No image</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.heartBtn}
            onPress={toggleWish}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isWished ? "heart" : "heart-outline"}
              size={18}
              color={isWished ? "#EC4899" : "#111827"}
            />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text numberOfLines={2} style={styles.cardName}>
            {item.name}
          </Text>

          {item.price !== undefined && (
            <Text style={styles.cardPrice}>${item.price}</Text>
          )}

          <Text style={styles.cardRating}>
            ⭐ {rating.toFixed(1)} ({count})
          </Text>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.screen}>
      <FlatList
        data={visibleProducts}
        key={isGrid ? "GRID" : "LIST"} // force FlatList rerender when change layout
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={isGrid ? 2 : 1}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListHeaderComponent={
          <>

            {/* BANNER "Shop Now" */}
            <LinearGradient
              colors={["#0e67ecff", "#34ebb4ff"]}
              style={styles.banner}
            >
              <Text style={styles.bannerTitle}>Shop Now</Text>
              <Text style={styles.bannerSubtitle}>
                Discover amazing products
              </Text>
            </LinearGradient>

            {/* SEARCH + FILTER AREA */}
            <View style={styles.contentWrapper}>
              {/* Search box */}
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  placeholder="Search products..."
                  placeholderTextColor="#9CA3AF"
                  value={search}
                  onChangeText={setSearch}
                  style={styles.searchInput}
                />
              </View>

              {/* Category */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryRow}
              >
                {["All", "Electronics", "Clothing", "Books"].map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        active && styles.categoryChipActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          active && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Sort + layout toggle */}
              <View style={styles.sortRow}>
                <View style={styles.sortLeft}>
                  <Text style={styles.sortLabel}>Sort by:</Text>
                  <TouchableOpacity
                    style={styles.sortPill}
                    onPress={() =>
                      setSortBy((prev) => (prev === "name" ? "price" : "name"))
                    }
                  >
                    <Text style={styles.sortPillText}>
                      {sortBy === "name" ? "Name" : "Price"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.layoutToggle}>
                  <TouchableOpacity
                    style={[
                      styles.layoutIconWrapper,
                      !isGrid && styles.layoutIconActive,
                    ]}
                    onPress={() => setIsGrid(false)}
                  >
                    <Text style={styles.layoutIcon}>☰</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.layoutIconWrapper,
                      isGrid && styles.layoutIconActive,
                    ]}
                    onPress={() => setIsGrid(true)}
                  >
                    <Text style={styles.layoutIcon}>▦</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        }
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // header
  headerBar: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  // banner
  banner: {
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  bannerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: "#E5E7EB",
    fontSize: 14,
  },

  contentWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  // search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
    color: "#111827",
  },

  // categories
  categoryRow: {
    marginTop: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#2563EB",
  },
  categoryChipText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: "#ffffff",
  },

  // sort + layout
  sortRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sortLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginRight: 8,
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },

  layoutToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  layoutIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
    backgroundColor: "#ffffff",
  },
  layoutIconActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  layoutIcon: {
    fontSize: 14,
    color: "#111827",
  },

  // product cards
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 10,
    overflow: "hidden",
    flex: 1,
  },
  cardGrid: {
    // when it is 2 columns, card occupies 1/2
  },
  cardImage: {
    width: "100%",
    height: 130,
    backgroundColor: "#E5E7EB",
  },
  cardImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardImagePlaceholderText: {
    fontSize: 12,
    color: "#6B7280",
  },
  cardBody: {
    padding: 10,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "700",
  },
  cardRating: {
    marginTop: 2,
    fontSize: 12,
    color: "#F59E0B",
    fontWeight: "500",
  },
  heartBtn: {
  position: "absolute",
  top: 8,
  right: 8,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: "rgba(255,255,255,0.9)",
  alignItems: "center",
  justifyContent: "center",
},
});
