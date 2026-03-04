import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { CartContext } from "../contexts/CartContext";

import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { createOrder } from "../services/orders";

import {
  getAddresses,
  addPaymentMethod,
  getPaymentMethods,
} from "../services/userData";

const CheckoutScreen = ({ navigation }) => {
  const { cartItems, totalPrice, clearCart } = useContext(CartContext);

  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [saveCard, setSaveCard] = useState(false);

  const tax = totalPrice * 0.08;
  const grandTotal = totalPrice + tax; // shipping = free

  const [askedShipping, setAskedShipping] = useState(false);

  // Payment picker (saved cards)
  const [askedPayment, setAskedPayment] = useState(false);
  const [paymentPickerOpen, setPaymentPickerOpen] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null); // {id, cardHolder, expiry, last4}

  // ✅ Dứt điểm autofill payment trên web: clear state khi vào màn hình
  useEffect(() => {
    setCardNumber("");
    setExpiryDate("");
    setCvv("");
  }, []);

  const openSavedCardPicker = async () => {
    if (askedPayment) return;
    setAskedPayment(true);

    const user = auth.currentUser;
    if (!user) return;

    try {
      const cards = await getPaymentMethods(user.uid);
      if (Array.isArray(cards) && cards.length > 0) {
        setSavedCards(cards);
        setPaymentPickerOpen(true);
      }
    } catch (e) {
      console.log("getPaymentMethods error:", e);
    }
  };

  const chooseSavedCard = (c) => {
    setSelectedCard(c);

    // fill name + expiry
    if (!cardholderName.trim() && c.cardHolder) setCardholderName(c.cardHolder);
    if (!expiryDate.trim() && c.expiry) setExpiryDate(c.expiry);

    // cvv always empty
    setCvv("");

    setCardNumber("");

    setPaymentPickerOpen(false);
  };

  // to fill shipping info
  const fillShippingFromSaved = async () => {
    const user = auth.currentUser;
    if (!user) {
      if (Platform.OS === "web")
        window.alert("Not logged in. Please log in again.");
      else Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    try {
      // 1) Profile (users/{uid})
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : null;

      // email
      if (!email.trim()) setEmail((data?.email || user.email || "").trim());

      // name
      const full = (data?.fullName || "").trim();
      if (full && (!firstName.trim() || !lastName.trim())) {
        const parts = full.split(" ").filter(Boolean);
        if (!firstName.trim()) setFirstName(parts[0] || "");
        if (!lastName.trim()) setLastName(parts.slice(1).join(" ") || "");
      }

      // phone
      if (!phone.trim() && data?.phone)
        setPhone(formatPhone(String(data.phone)));

      // 2) Saved address (users/{uid}/addresses)
      let list = [];
      try {
        list = await getAddresses(user.uid);
      } catch (e) {
        console.log("getAddresses error:", e);
        if (Platform.OS === "web")
          window.alert(e?.message || "Cannot read addresses");
        else Alert.alert("Error", e?.message || "Cannot read addresses");
        return;
      }

      if (Array.isArray(list) && list.length > 0) {
        const a = list[0];

        const addr = a.address || a.street || a.streetAddress || "";
        if (!address.trim() && addr) setAddress(addr);

        if (!city.trim() && a.city) setCity(a.city);

        const prov = a.state || a.province || "";
        if (!province.trim() && prov) setProvince(prov);

        const zip = a.zip || a.postalCode || a.postal || "";
        if (!postalCode.trim() && zip)
          setPostalCode(formatPostalCode(String(zip)));

        const ph = a.phone || a.phoneNumber || "";
        if (!phone.trim() && ph) setPhone(formatPhone(String(ph)));

        if ((!firstName.trim() || !lastName.trim()) && a.fullName) {
          const parts = String(a.fullName).trim().split(" ").filter(Boolean);
          if (!firstName.trim()) setFirstName(parts[0] || "");
          if (!lastName.trim()) setLastName(parts.slice(1).join(" ") || "");
        }
      }
    } catch (e) {
      console.log("fillShippingFromSaved error:", e);
      if (Platform.OS === "web") window.alert(e?.message || "Fill failed");
      else Alert.alert("Error", e?.message || "Fill failed");
    }
  };

  // ask if user wanna fill shipping info
  const askUseSavedShipping = async () => {
    if (askedShipping) return;

    setAskedShipping(true);

    if (Platform.OS === "web") {
      const ok = window.confirm(
        "Do you want to fill shipping information from your saved profile/address?"
      );
      if (ok) {
        await fillShippingFromSaved();
      }
      return;
    }

    Alert.alert(
      "Use saved shipping info?",
      "Do you want to fill shipping information from your saved profile/address?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: async () => await fillShippingFromSaved() },
      ]
    );
  };

  // Format postal code
  const formatPostalCode = (text) => {
    const cleaned = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);

    if (cleaned.length <= 3) return cleaned;
    return cleaned.slice(0, 3) + " " + cleaned.slice(3);
  };

  // format Phone number
  const formatPhone = (text) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 10);

    if (cleaned.length < 4) return cleaned;

    if (cleaned.length < 7) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }

    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  };

  // format card number
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const handleExpiryChange = (text) => {
    let cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length > 4) cleaned = cleaned.slice(0, 4);
    if (cleaned.length >= 3) cleaned = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    setExpiryDate(cleaned);
  };

  // show msg for web and mobile
  const showAlert = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      showAlert("Cart is empty", "Please add some products first.");
      return;
    }

    // Shipping constraints
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !province.trim() ||
      !postalCode.trim()
    ) {
      showAlert("Missing Information", "Please fill in all shipping fields.");
      return;
    }

    // email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    // phone digits (basic 10-digit check)
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      showAlert("Invalid Phone", "Phone number must be 10 digits.");
      return;
    }

    // Canadian postal code (A1A 1A1)
    const postalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    if (!postalRegex.test(postalCode.trim())) {
      showAlert("Invalid Postal Code", "Example: N6A 3K7");
      return;
    }

    // ✅ Payment constraints
    // Nếu user KHÔNG chọn saved card -> bắt nhập 16 digits
    if (!selectedCard) {
      const cardDigits = cardNumber.replace(/\D/g, "");
      if (!/^\d{16}$/.test(cardDigits)) {
        showAlert("Invalid Card Number", "Card number must be 16 digits.");
        return;
      }
    }

    if (!cardholderName.trim()) {
      showAlert("Missing Name", "Please enter cardholder name.");
      return;
    }

    // expiry date: MM/YY
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiryDate)) {
      showAlert(
        "Invalid expiry date",
        "Please enter expiry date in MM/YY format (e.g. 04/27)."
      );
      return;
    }

    // CVV
    const cvvRegex = /^\d{3}$/;
    if (!cvvRegex.test(cvv)) {
      showAlert("Invalid CVV", "CVV must be exactly 3 digits.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      showAlert("Not logged in", "Please log in again.");
      return;
    }

    try {
      const orderId = await createOrder({
        userId: user.uid,
        items: cartItems,
        subtotal: totalPrice,
        tax,
        total: grandTotal,
      });

      // Save card (chỉ lưu last4 + expiry + holder)
      if (saveCard) {
        // Nếu user chọn saved card thì last4 lấy từ selectedCard
        if (selectedCard?.last4) {
          await addPaymentMethod(user.uid, {
            cardHolder: cardholderName,
            expiry: expiryDate,
            last4: selectedCard.last4,
          });
        } else {
          const digits = cardNumber.replace(/\D/g, "");
          const last4 = digits.slice(-4);
          if (last4.length === 4) {
            await addPaymentMethod(user.uid, {
              cardHolder: cardholderName,
              expiry: expiryDate,
              last4,
            });
          }
        }
      }
      // place order web & mobile
      if (Platform.OS === "web") {
        window.alert(`Order placed!\n\nYour order #${orderId} has been placed.`);
        clearCart();
        navigation.getParent()?.navigate("Home");
        return;
      }

      Alert.alert("Order placed!", `Your order #${orderId} has been placed.`, [
        {
          text: "OK",
          onPress: () => {
            clearCart();
            navigation.getParent()?.navigate("Home");
          },
        },
      ]);
    } catch (error) {
      console.log("Error creating order:", error);
      Alert.alert("Error", "Could not place order. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Order summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>

          {cartItems.length > 0 ? (
            <>
              {cartItems.map((item) => (
                <View style={styles.summaryRow} key={item.id}>
                  <Text style={styles.itemLine}>
                    {item.name} x {item.quantity}
                  </Text>
                  <Text style={styles.itemAmount}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (8%)</Text>
                <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>Free</Text>
              </View>

              <View style={styles.summaryRowTotal}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>
                  ${grandTotal.toFixed(2)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.itemLine}>No items in cart.</Text>
          )}
        </View>

        {/* Shipping info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipping Information</Text>

          <View style={styles.row}>
            <View style={styles.halfInputWrapper}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                placeholderTextColor="#6B7280"
                returnKeyType="next"
                value={firstName}
                onChangeText={setFirstName}
                onFocus={askUseSavedShipping}
              />
            </View>
            <View style={[styles.halfInputWrapper, { marginRight: 0 }]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                placeholderTextColor="#6B7280"
                returnKeyType="next"
                value={lastName}
                onChangeText={setLastName}
                onFocus={askUseSavedShipping}
              />
            </View>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor="#6B7280"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            onFocus={askUseSavedShipping}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(t) => setPhone(formatPhone(t))}
            placeholder="e.g. (519) 123-4567"
            placeholderTextColor="#6B7280"
            keyboardType="phone-pad"
            maxLength={14}
            returnKeyType="next"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter street address"
            placeholderTextColor="#6B7280"
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.row}>
            <View style={styles.halfInputWrapper}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter city"
                placeholderTextColor="#6B7280"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.halfInputWrapper, { marginRight: 0 }]}>
              <Text style={styles.label}>Province</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Province"
                placeholderTextColor="#6B7280"
                value={province}
                onChangeText={setProvince}
              />
            </View>
          </View>

          <Text style={styles.label}>Postal Code</Text>
          <TextInput
            style={styles.input}
            value={postalCode}
            onChangeText={(t) => setPostalCode(formatPostalCode(t))}
            placeholder="e.g. N6A 3K7"
            placeholderTextColor="#6B7280"
            keyboardType="default"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
            returnKeyType="next"
          />
        </View>

        {/* Payment Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Information</Text>

          {Platform.OS === "web" ? (
            <>
              <Text style={styles.label}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
                value={
                  selectedCard?.last4 ? `•••• •••• •••• ${selectedCard.last4}` : cardNumber
                }
                onChangeText={(t) => {
                  // when user enter manually unselect saved card
                  if (selectedCard) setSelectedCard(null);
                  setCardNumber(formatCardNumber(t));
                }}
                maxLength={19}
                returnKeyType="next"
                onFocus={openSavedCardPicker}
                editable={!selectedCard} 
              />
              {selectedCard && (
                <Text style={{ marginTop: 6, color: "#374151" }}>
                  Using saved card: •••• {selectedCard.last4} (CVV still required)
                </Text>
              )}

              <View style={styles.row}>
                <View style={styles.halfInputWrapper}>
                  <Text style={styles.label}>Expiry Date</Text>
                  <input
                    style={styles.webInput}
                    placeholder="MM/YY"
                    placeholderTextColor="#6B7280"
                    value={expiryDate}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    autoComplete="new-password"
                    name="not-exp"
                    inputMode="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={[styles.halfInputWrapper, { marginRight: 0 }]}>
                  <Text style={styles.label}>CVV</Text>
                  <input
                    style={styles.webInput}
                    placeholder="123"
                    placeholderTextColor="#6B7280"
                    value={cvv}
                    type="password"
                    onChange={(e) =>
                      setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                    }
                    autoComplete="new-password"
                    name="not-cvv"
                    inputMode="numeric"
                    maxLength={3}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
                value={cardNumber}
                onChangeText={(t) => {
                  if (selectedCard) setSelectedCard(null);
                  setCardNumber(formatCardNumber(t));
                }}
                maxLength={19}
                returnKeyType="next"
                onFocus={openSavedCardPicker}
              />

              {selectedCard && (
                <Text style={{ marginTop: 6, color: "#374151" }}>
                  Using saved card: •••• {selectedCard.last4} (CVV still required)
                </Text>
              )}

              <View style={styles.row}>
                <View style={styles.halfInputWrapper}>
                  <Text style={styles.label}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    maxLength={5}
                    value={expiryDate}
                    onChangeText={handleExpiryChange}
                  />
                </View>

                <View style={[styles.halfInputWrapper, { marginRight: 0 }]}>
                  <Text style={styles.label}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry={true}
                    value={cvv}
                    onChangeText={setCvv}
                    
                  />
                </View>
              </View>
            </>
          )}

          <Text style={styles.label}>Cardholder Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter cardholder name"
            placeholderTextColor="#6B7280"
            value={cardholderName}
            onChangeText={setCardholderName}
          />

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => {
                if (selectedCard) return;
                setSaveCard(!saveCard);
              }}
              style={{
                width: 20,
                height: 20,
                borderWidth: 1,
                borderColor: "#9CA3AF",
                marginRight: 8,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {saveCard && <Text>✓</Text>}
            </TouchableOpacity>
            <Text>Save this card</Text>
          </View>
        </View>

        {/* Saved cards modal */}
        <Modal
          visible={paymentPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPaymentPickerOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Use a saved card</Text>

              <ScrollView style={{ maxHeight: 260 }}>
                {savedCards.map((c, idx) => (
                  <TouchableOpacity
                    key={c.id || idx}
                    style={styles.cardRow}
                    onPress={() => chooseSavedCard(c)}
                  >
                    <View>
                      <Text style={styles.cardRowText}>
                        •••• •••• •••• {c.last4 || "----"}
                      </Text>
                      <Text style={styles.cardRowSub}>
                        {c.cardHolder || "Card"} · Exp {c.expiry || "--/--"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setPaymentPickerOpen(false)}
                >
                  <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={styles.placeButton} onPress={handlePlaceOrder}>
          <Text style={styles.placeButtonText}>
            Place Order - ${grandTotal.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },
  itemLine: { marginBottom: 8, color: "#111827" },
  itemAmount: { color: "#111827" },

  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 10 },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  summaryLabel: { color: "#6B7280" },
  summaryValue: { color: "#111827" },
  summaryTotalLabel: { fontWeight: "700", fontSize: 16 },
  summaryTotalValue: { fontWeight: "700", fontSize: 16, color: "#2563EB" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInputWrapper: { flex: 1, marginRight: 8 },
  label: {
    fontSize: 12,
    color: "#101111ff",
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },

  // ✅ web-only input style
  webInput: {
    width: "100%",
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    padding: 10,
    fontSize: 14,
    borderWidth: 0,
    outlineStyle: "none",
  },

  placeButton: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  placeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cardRowText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  cardRowSub: {
    marginTop: 2,
    color: "#6B7280",
    fontSize: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalBtnCancel: {
    backgroundColor: "#F3F4F6",
  },
  modalBtnClear: {
    backgroundColor: "#2563EB",
  },
  modalBtnTextCancel: {
    color: "#111827",
    fontWeight: "700",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});