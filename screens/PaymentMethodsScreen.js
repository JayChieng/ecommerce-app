import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase";
import {
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../services/userData";


const createEmptyCard = () => ({
  id: null,
  cardHolder: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
});

// show card number like **** **** **** 3456
const maskCardNumber = (item) => {
  const last4 = item?.last4 || "";
  return last4 ? "**** **** **** " + last4 : "**** **** **** ----";
};


const PaymentMethodsScreen = () => {
  // example model
  const [cards, setCards] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [form, setForm] = useState(createEmptyCard());

  useEffect(() => {
  const load = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const list = await getPaymentMethods(user.uid);
    setCards(list);
  };
  load();
}, []);

  // format card number: 1234 5678 9012 3456
  const handleCardNumberChange = (text) => {
    let cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length > 16) cleaned = cleaned.slice(0, 16);

    const groups = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      groups.push(cleaned.slice(i, i + 4));
    }
    const formatted = groups.join(" ");
    setForm({ ...form, cardNumber: formatted });
  };

  // format expiry MM/YY
  const handleExpiryChange = (text) => {
    let cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length > 4) cleaned = cleaned.slice(0, 4);
    if (cleaned.length >= 3) {
      cleaned = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    }
    setForm({ ...form, expiry: cleaned });
  };

  // Add card
  const handleAddPress = () => {
    setIsNew(true);
    setForm(createEmptyCard());
    setModalVisible(true);
  };

  // Edit card
  const handleEditPress = (card) => {
    setIsNew(false);
    setForm({
      id: card.id,
      cardHolder: card.cardHolder || "",
      cardNumber: "",  
      expiry: card.expiry || "",
      cvv: "", 
    });
    setModalVisible(true);
  };

  // Delete card
  const handleDeletePress = async (id) => {
    // WEB
    if (Platform.OS === "web") {
      const ok = window.confirm("Are you sure you want to delete this card?");
      if (!ok) return;

      const user = auth.currentUser;
      if (!user) {
        window.alert("Not logged in. Please login again.");
        return;
      }

      try {
        await deletePaymentMethod(user.uid, id);
        const list = await getPaymentMethods(user.uid);
        setCards(list);
      } catch (e) {
        console.log("Delete card error:", e);
        window.alert(e?.message || "Failed to delete card");
      }
      return;
    }

    // MOBILE
    Alert.alert("Delete Card", "Are you sure you want to delete this card?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const user = auth.currentUser;
          if (!user) return;

          await deletePaymentMethod(user.uid, id);

          const list = await getPaymentMethods(user.uid);
          setCards(list);
        },
      },
    ]);
  };

  // Save card
  const handleSaveCard = async () => {
  const user = auth.currentUser;
  if (!user) return;

  if (!form.cardHolder.trim() || !form.cardNumber.trim()) {
    Alert.alert("Missing info", "Please enter Cardholder Name and Number.");
    return;
  }

  const digits = form.cardNumber.replace(/\s/g, "");
  if (digits.length < 12) {
    Alert.alert("Invalid card", "Card number looks too short.");
    return;
  }

  const cvvRegex = /^\d{3}$/;
  if (!cvvRegex.test(form.cvv)) {
    Alert.alert("Invalid CVV", "CVV must be exactly 3 digits.");
    return;
  }

  // only save mock-safe fields
  const payload = {
    cardHolder: form.cardHolder.trim(),
    expiry: form.expiry,
    last4: digits.slice(-4),
  };

  if (isNew || !form.id) {
    await addPaymentMethod(user.uid, payload);
  } else {
    await updatePaymentMethod(user.uid, form.id, payload);
  }

  const list = await getPaymentMethods(user.uid);
  setCards(list);

  setModalVisible(false);
};

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardHolder}>{item.cardHolder}</Text>
        <Text style={styles.cardNumberText}>{maskCardNumber(item)}</Text>
        <Text style={styles.cardDetail}>Expires: {item.expiry}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={{ marginRight: 8 }}
          onPress={() => handleEditPress(item)}
        >
          <Ionicons name="pencil-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeletePress(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & title + button + */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* Modal Add / Edit Card */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isNew ? "Add Card" : "Edit Card"}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>Card Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              keyboardType="numeric"
              value={form.cardNumber}
              onChangeText={handleCardNumberChange}
            />

            <View style={styles.row}>
              <View style={[styles.half, { marginRight: 8 }]}>
                <Text style={styles.label}>Expiry Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  keyboardType="numeric"
                  maxLength={5}
                  value={form.expiry}
                  onChangeText={handleExpiryChange}
                />
              </View>
              <View style={[styles.half, { marginLeft: 8 }]}>
                <Text style={styles.label}>CVV *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                  value={form.cvv}
                  onChangeText={(text) => setForm({ ...form, cvv: text })}
                />
              </View>
            </View>

            <Text style={styles.label}>Cardholder Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Name on card"
              value={form.cardHolder}
              onChangeText={(text) =>
                setForm({ ...form, cardHolder: text })
              }
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveCard}
            >
              <Text style={styles.saveButtonText}>
                {isNew ? "Add Card" : "Update Card"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default PaymentMethodsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  cardHolder: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111827",
  },
  cardNumberText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 2,
  },
  cardDetail: {
    fontSize: 12,
    color: "#6B7280",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  modalContent: {
    padding: 16,
  },

  label: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  row: {
    flexDirection: "row",
    marginTop: 4,
  },
  half: {
    flex: 1,
  },

  saveButton: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
