import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform, 
} from "react-native";
import { CartContext } from "../contexts/CartContext";

import { db, auth } from "../firebase";
// firebase
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import {
  listenWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../services/userData";

const ProductDetailScreen = ({ route, navigation }) => { 
  const { product } = route.params;
  const { addToCart } = useContext(CartContext); 

  const productId = product.id;
  const [quantity, setQuantity] = useState(1);

  const features = Array.isArray(product.features) ? product.features : [];
  
  // Reviews từ Firestore
  const [reviews, setReviews] = useState([]);
  const [ratingAvg, setRatingAvg] = useState(Number(product.ratingAvg || 0));
  const [ratingCount, setRatingCount] = useState(Number(product.ratingCount || 0));

  // Form review
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");

  const mainImage =
    product.imageUrl ||
    (Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : null);

  const decreaseQuantity = () => {
    setQuantity((q) => (q > 1 ? q - 1 : 1));
  };

  const increaseQuantity = () => {
    setQuantity((q) => q + 1);
  };

  // listener realtime to rating and reviews
  useEffect(() => {
  if (!productId) return;

  // 1) Listen product rating summary
  const productRef = doc(db, "products", productId);
  const unsubProduct = onSnapshot(productRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    setRatingAvg(Number(data.ratingAvg || 0));
    setRatingCount(Number(data.ratingCount || 0));
  });

  // 2) Listen reviews list
  const reviewsRef = collection(db, "products", productId, "reviews");
  const q = query(reviewsRef, orderBy("createdAt", "desc"));
  const unsubReviews = onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setReviews(list);
  });

  // cleanup : when component unmount-> productId change->delete listener: avoid memory leak or multiple runtime of listener
  return () => {
    unsubProduct();
    unsubReviews();
  };
}, [productId]);

  // State + listener isWished (wishlist)
  const [isWished, setIsWished] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !productId) {
      setIsWished(false);
      return;
    }

    const unsub = listenWishlist(uid, (list) => {
      setIsWished(list.some((x) => x.productId === productId));
    });

    return () => unsub?.();
  }, [productId]);

  // Toglle wishlist
  const toggleWish = async () => {
    const u = auth.currentUser;
    if (!u) {
      Alert.alert("Login required", "Please login to use Wishlist.");
      return;
    }

    try {
      if (isWished) {
        await removeFromWishlist(u.uid, productId);
      } else {
        await addToWishlist(u.uid, product);
      }
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not update wishlist.");
    }
  };

  // Move to cart
  const handleAddToCart = () => {
    addToCart(product, quantity);
    Alert.alert(
      "Added to Cart",
      `${product.name} (${quantity}) has been added to your cart.`,
      [
        {
          text: "CONTINUE SHOPPING",
          style: "cancel",
        },
        {
          text: "VIEW CART",
          onPress: () => {
            // HomeStack --> tab Cart
            navigation.getParent()?.navigate("Cart");
          },
        },
      ]
    );
  };

  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;

  const discountPercent = hasDiscount
    ? Math.round(100 - (product.price / product.originalPrice) * 100)
    : 0;

  return (
    <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} 
    >
    
      <ScrollView 
       contentContainerStyle={styles.scrollContent}
       keyboardShouldPersistTaps="handled"
      >
        {mainImage && (
          <Image
            source={{ uri: mainImage }}
            style={styles.productImage}
            resizeMode="cover"
          />
        )}

        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.nameRow}>
            <Text style={[styles.productName, { flex: 1, paddingRight: 12 }]}>
              {product.name}
            </Text>

            <TouchableOpacity onPress={toggleWish} activeOpacity={0.8}>
              <Ionicons
                name={isWished ? "heart" : "heart-outline"}
                size={24}
                color={isWished ? "#EC4899" : "#111827"}
              />
            </TouchableOpacity>
          </View>


          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price}</Text>
            {hasDiscount && (
              <>
                <Text style={styles.originalPrice}>
                  ${product.originalPrice}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                </View>
              </>
            )}
          </View>

          {/* Rating row */}
          <View style={styles.ratingRow}>
            <Text style={styles.stars}>
              {"⭐".repeat(Math.max(0, Math.min(5, Math.round(ratingAvg || 0))))}
              {"☆".repeat(Math.max(0, 5 - Math.round(ratingAvg || 0)))}
            </Text>
            <Text style={styles.ratingValue}>
              {ratingAvg ? Number(ratingAvg).toFixed(1) : "0.0"}
            </Text>
            <Text style={styles.ratingCount}>
              ({ratingCount || reviews.length} reviews)
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={decreaseQuantity}
            >
              <Text style={styles.qtyButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={increaseQuantity}
            >
              <Text style={styles.qtyButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          {features.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <View style={styles.featureDotOuter}>
                <View style={styles.featureDotInner} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>

          {/* --- Write a review (production safe-ish without backend) --- */}
          <View style={styles.reviewForm}>
            <Text style={styles.reviewFormTitle}>Your Rating</Text>

            <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setMyRating(n)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 18 }}>{n <= myRating ? "⭐" : "☆"}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={myComment}
              onChangeText={setMyComment}
              placeholder="Write your review..."
              multiline
              style={styles.reviewInput}
            />

            <TouchableOpacity
              style={styles.submitReviewBtn}
              onPress={async () => {
                const user = auth.currentUser;
                if (!user) {
                  Alert.alert("Login required", "Please login to submit a review.");
                  return;
                }
                if (!productId) {
                  Alert.alert("Error", "Missing productId.");
                  return;
                }
                if (!myComment.trim()) {
                  Alert.alert("Validation", "Please enter a comment.");
                  return;
                }
                if (myComment.trim().length > 500) {
                  Alert.alert("Validation", "Comment must be 500 characters or less.");
                  return;
                }

                const productRef = doc(db, "products", productId);
                const reviewRef = doc(db, "products", productId, "reviews", user.uid);

                try {
                  await runTransaction(db, async (tx) => {
                    const productSnap = await tx.get(productRef);
                    if (!productSnap.exists()) throw new Error("Product not found");

                    const userRef = doc(db, "users", user.uid);

                    const productData = productSnap.data();
                    const oldAvg = Number(productData.ratingAvg || 0);
                    const oldCount = Number(productData.ratingCount || 0);

                    const oldReviewSnap = await tx.get(reviewRef);
                    const hadOld = oldReviewSnap.exists();
                    const oldRating = hadOld ? Number(oldReviewSnap.data().rating || 0) : 0;

                    if (!hadOld) {
                      const userSnap = await tx.get(userRef);
                      const oldRC = userSnap.exists()
                        ? Number(userSnap.data().reviewCount || 0)
                        : 0;

                      tx.set(userRef, { reviewCount: oldRC + 1 }, { merge: true });
                    }

                    // Save/Update review (docId=user.uid => 1 review per user per product)
                    tx.set(
                      reviewRef,
                      {
                        userId: user.uid,
                        userName: user.displayName || user.email || "User",
                        rating: myRating,
                        comment: myComment.trim(),
                        updatedAt: serverTimestamp(),
                        createdAt: hadOld ? oldReviewSnap.data().createdAt : serverTimestamp(),
                      },
                      { merge: true }
                    );

                    // Update rating summary
                    let newAvg = oldAvg;
                    let newCount = oldCount;

                    if (!hadOld) {
                      newCount = oldCount + 1;
                      newAvg = oldCount === 0 ? myRating : (oldAvg * oldCount + myRating) / (oldCount + 1);
                    } else {
                      newCount = oldCount;
                      newAvg = oldCount === 0 ? myRating : (oldAvg * oldCount - oldRating + myRating) / oldCount;
                    }

                    tx.update(productRef, {
                      ratingAvg: Number(newAvg.toFixed(2)),
                      ratingCount: newCount,
                    });
                  });

                  setMyComment("");
                  Alert.alert("Success", "Review submitted.");
                } catch (e) {
                  Alert.alert("Error", String(e.message || e));
                }
              }}
            >
              <Text style={styles.submitReviewText}>Submit Review</Text>
            </TouchableOpacity>
          </View>

          {/* --- Reviews list --- */}
          {reviews.length === 0 ? (
            <Text style={{ color: "#6B7280" }}>No reviews yet.</Text>
          ) : (
            reviews.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{rev.userName || "User"}</Text>
                  <Text style={styles.reviewStars}>
                    {"⭐".repeat(Math.max(1, Math.min(5, Math.round(rev.rating || 5))))}
                  </Text>
                </View>
                <Text style={styles.reviewComment}>{rev.comment || ""}</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Add to Cart footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContent: {
    paddingBottom: 16,
  },
  productImage: {
    width: "100%",
    height: 260,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  productName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  price: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563EB",
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: "#F97316",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stars: {
    fontSize: 14,
    marginRight: 6,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
    color: "#111827",
  },
  ratingCount: {
    fontSize: 12,
    color: "#6B7280",
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 4,
    marginBottom: 4,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
    color: "#111827",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  featureDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  featureDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FACC15",
  },
  featureText: {
    fontSize: 14,
    color: "#4B5563",
  },
  reviewCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  reviewStars: {
    fontSize: 14,
  },
  reviewComment: {
    fontSize: 13,
    color: "#4B5563",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  addToCartButton: {
    backgroundColor: "#2563EB",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  reviewForm: {
  backgroundColor: "#F9FAFB",
  borderRadius: 12,
  padding: 12,
  marginBottom: 10,
},
reviewFormTitle: {
  fontSize: 14,
  fontWeight: "700",
  color: "#111827",
  marginBottom: 8,
},
reviewInput: {
  minHeight: 70,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 10,
  padding: 10,
  backgroundColor: "#FFFFFF",
  marginBottom: 10,
  color: "#111827",
},
submitReviewBtn: {
  backgroundColor: "#111827",
  paddingVertical: 12,
  borderRadius: 999,
  alignItems: "center",
},
submitReviewText: {
  color: "#FFFFFF",
  fontWeight: "700",
},
nameRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

});
