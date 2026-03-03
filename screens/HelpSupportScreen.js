import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const FAQ_SECTIONS = [
  {
    id: "orders",
    title: "Orders & Shipping",
    content: [
      "How can I track my order?\nYou can track your order by going to your Order History in the Profile section. Tap on any order to see detailed tracking information.",
      "What are the shipping options?\nWe offer free standard shipping on all orders. Express shipping is available for an additional fee.",
      "How long does shipping take?\nStandard shipping takes 3–5 business days. Express shipping takes 1–2 business days.",
    ],
  },
  {
    id: "returns",
    title: "Returns & Refunds",
    content: [
      "What is your return policy?\nYou can return most items within 30 days of delivery in original condition.",
      "How do I start a return?\nGo to My Orders, select the order, and tap 'Start a return'.",
    ],
  },
  {
    id: "account",
    title: "Account & Profile",
    content: [
      "How do I update my profile?\nYou can update your profile details from the Profile section.",
      "I forgot my password, what should I do?\nUse the 'Forgot Password' link on the login screen to reset your password.",
    ],
  },
  {
    id: "payment",
    title: "Payment & Billing",
    content: [
      "What payment methods do you accept?\nWe accept major credit cards, PayPal, and Apple Pay.",
      "Is my payment information secure?\nYes, we use industry-standard encryption to protect your payment information.",
      "Can I save my payment methods?\nYes, you can save payment methods in Profile > Payment Methods.",
    ],
  },
];

const HelpSupportScreen = () => {
  const [expandedId, setExpandedId] = useState("orders");
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");

  const toggleSection = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleEmailSupport = () => {
    Alert.alert(
      "Email Support",
      "Send us an email at support@ecommerceapp.com"
    );
  };

  const handlePhoneSupport = () => {
    Alert.alert("Phone Support", "Call us at +1 (555) 123-4567");
  };

  const handleLiveChat = () => {
    Alert.alert(
      "Live Chat",
      "Live chat is available Monday–Friday, 9 AM – 6 PM EST."
    );
  };

  const handleSendMessage = () => {
    if (!name || !contactEmail || !message) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    Alert.alert(
      "Message sent",
      "Thank you for contacting us. We will reply soon."
    );
    setName("");
    setContactEmail("");
    setMessage("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F3F4F6" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
    >
      <LinearGradient
        colors={["#0e67ecff", "#34ebb4ff"]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Help & Support</Text>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* FAQ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Frequently Asked Questions</Text>

          {FAQ_SECTIONS.map((section) => {
            const isOpen = expandedId === section.id;
            return (
              <View key={section.id} style={styles.faqSection}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleSection(section.id)}
                >
                  <View style={styles.faqHeaderLeft}>
                    <Ionicons
                      name="help-circle-outline"
                      size={20}
                      color="#2563EB"
                    />
                    <Text style={styles.faqTitle}>{section.title}</Text>
                  </View>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.faqContent}>
                    {section.content.map((text, idx) => (
                      <Text key={idx} style={styles.faqText}>
                        {text}
                        {"\n"}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Contact us */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Us</Text>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={handleEmailSupport}
          >
            <View style={styles.contactLeft}>
              <Ionicons name="mail-outline" size={20} color="#2563EB" />
              <View>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.contactSubtitle}>Get help via email</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={handlePhoneSupport}
          >
            <View style={styles.contactLeft}>
              <Ionicons name="call-outline" size={20} color="#10B981" />
              <View>
                <Text style={styles.contactTitle}>Phone Support</Text>
                <Text style={styles.contactSubtitle}>Call us directly</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={handleLiveChat}
          >
            <View style={styles.contactLeft}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color="#F59E0B"
              />
              <View>
                <Text style={styles.contactTitle}>Live Chat</Text>
                <Text style={styles.contactSubtitle}>Chat with our team</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Send message form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Send us a Message</Text>

          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={contactEmail}
            onChangeText={setContactEmail}
          />

          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: "top" }]}
            placeholder="Describe your issue or question..."
            multiline
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default HelpSupportScreen;

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
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
  // FAQ
  faqSection: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
  },
  faqHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  faqTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  faqContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  faqText: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 4,
  },
  // Contact
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 10,
  },
  contactSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 10,
  },
  // Form
  label: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendButton: {
    marginTop: 14,
    backgroundColor: "#2563EB",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
