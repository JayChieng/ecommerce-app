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
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../services/userData";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const createEmptyAddress = () => ({
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
});

const formatPhone = (text) => {
  const cleaned = text.replace(/\D/g, "").slice(0, 10);

  if (cleaned.length < 4) return cleaned;

  if (cleaned.length < 7) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  }

  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

const AddressScreen = () => {
  // example model
  const [addresses, setAddresses] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [form, setForm] = useState(createEmptyAddress());

  useEffect(() => {
  const load = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const list = await getAddresses(user.uid);
    setAddresses(list);
  };
  load();
}, []);

  const insets = useSafeAreaInsets();


  // add new
  const handleAddPress = () => {
    setIsNew(true);
    setForm(createEmptyAddress());
    setModalVisible(true);
  };

  // edit
  const handleEditPress = (addr) => {
    setIsNew(false);
    setForm(addr);
    setModalVisible(true);
  };

  // delete
  const handleDeletePress = async (id) => {
      // WEB
    if (Platform.OS === "web") {
      const ok = window.confirm("Are you sure you want to delete this address?");
      if (!ok) return;

      const user = auth.currentUser;
      if (!user) {
        window.alert("Session lost. Please login again.");
        return;
      }

      try {
        await deleteAddress(user.uid, id);

        const list = await getAddresses(user.uid);
        setAddresses(list);
      } catch (e) {
        console.log("Delete address error:", e);
        window.alert(e?.message || "Failed to delete address");
      }
      return;
    }

    // MOBILE
    Alert.alert("Delete Address", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const user = auth.currentUser;
          if (!user) return;

          await deleteAddress(user.uid, id);

          const list = await getAddresses(user.uid);
          setAddresses(list);
        },
      },
    ]);
  };


  // save or update
  const handleSaveAddress = async () => {
    const user = auth.currentUser;
    if (!user) {
      if (Platform.OS === "web") window.alert("Not logged in. Please login again.");
      else Alert.alert("Not logged in", "Please login again.");
      return;
    }

    // helpers  
    const showMsg = (title, msg) => {
      if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
      else Alert.alert(title, msg);
    };

    const cleanPhone = (t) => (t || "").replace(/\D/g, "").slice(0, 10);

    const formatPhone = (t) => {
      const d = cleanPhone(t);
      if (d.length < 4) return d;
      if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    };

    const formatPostal = (t) => {
      const cleaned = (t || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6);
      if (cleaned.length <= 3) return cleaned;
      return cleaned.slice(0, 3) + " " + cleaned.slice(3);
    };

    //  normalize 
    const fullName = (form.fullName || "").trim();
    const address = (form.address || "").trim();
    const city = (form.city || "").trim();
    const province = (form.state || "").trim();
    const phone = formatPhone(form.phone || "");
    const zip = formatPostal(form.zip || "");

    //  validate required 
    if (!fullName) return showMsg("Missing info", "Full Name is required.");
    if (!phone) return showMsg("Missing info", "Phone Number is required.");
    if (!address) return showMsg("Missing info", "Address is required.");
    if (!city) return showMsg("Missing info", "City is required.");
    if (!province) return showMsg("Missing info", "Province is required.");
    if (!zip) return showMsg("Missing info", "Postal Code is required.");

    // validate formats 
    if (cleanPhone(phone).length !== 10) {
      return showMsg("Invalid Phone", "Phone number must be 10 digits (e.g. 5191234567).");
    }

    const postalRegex = /^[A-Za-z]\d[A-Za-z][ ]?\d[A-Za-z]\d$/;
    if (!postalRegex.test(zip)) {
      return showMsg("Invalid Postal Code", "Example: N6A 3K7");
    }

    // (optional) province code 2 letters (ON, BC...) 
    // const provRegex = /^[A-Z]{2}$/;
    // if (!provRegex.test(province.toUpperCase())) {
    //   return showMsg("Invalid Province", "Use 2-letter code like ON, BC, AB...");
    // }

    try {
      const { id, ...payload } = form;

      payload.fullName = fullName;
      payload.phone = phone;
      payload.address = address;
      payload.city = city;
      payload.state = province.toUpperCase();
      payload.zip = zip;

      if (isNew) {
        await addAddress(user.uid, payload);
      } else {
        await updateAddress(user.uid, id, payload);
      }

      const list = await getAddresses(user.uid);
      setAddresses(list);
      setModalVisible(false);
    } catch (e) {
      console.log("Save address error:", e);
      showMsg("Error", e?.message || "Could not save address.");
    }
  };

  const renderAddressCard = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.fullName}</Text>
        <Text style={styles.cardLine}>{item.address}</Text>
        <Text style={styles.cardLine}>
          {item.city}, {item.state} {item.zip}
        </Text>
        <Text style={styles.cardLine}>Phone: {item.phone}</Text>
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
      {/* Header with + button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* adress card list */}
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        renderItem={renderAddressCard}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* Modal Edit / Add Address */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header Edit Address */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isNew ? "Add Address" : "Edit Address"}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={form.fullName}
              onChangeText={(text) => setForm({ ...form, fullName: text })}
              placeholder="Full name"
            />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(text) =>
                setForm({ ...form, phone: formatPhone(text) })
              }
              placeholder="e.g. 5191234567"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              value={form.address}
              onChangeText={(text) => setForm({ ...form, address: text })}
              placeholder="Street address"
            />

            <View style={styles.row}>
              <View style={[styles.half, { marginRight: 8 }]}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={form.city}
                  onChangeText={(text) => setForm({ ...form, city: text })}
                  placeholder="City"
                />
              </View>
              <View style={[styles.half, { marginLeft: 8 }]}>
                <Text style={styles.label}>Province *</Text>
                <TextInput
                  style={styles.input}
                  value={form.state}
                  onChangeText={(text) => setForm({ ...form, state: text })}
                  placeholder="Province"
                />
              </View>
            </View>

            <Text style={styles.label}>Postal Code *</Text>
            <TextInput
              style={styles.input}
              value={form.zip}
              onChangeText={(text) => {
                const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
                const formatted = cleaned.length <= 3 ? cleaned : cleaned.slice(0, 3) + " " + cleaned.slice(3);
                setForm({ ...form, zip: formatted });
              }}
              placeholder="e.g. N6A 3K7"
              keyboardType="default"
              autoCapitalize="characters"
              maxLength={7}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveAddress}
            >
              <Text style={styles.saveButtonText}>
                {isNew ? "Add Address" : "Update Address"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default AddressScreen;

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
    alignItems: "flex-start",
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111827",
  },
  cardLine: {
    fontSize: 13,
    color: "#4B5563",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },

  // Modal edit
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
