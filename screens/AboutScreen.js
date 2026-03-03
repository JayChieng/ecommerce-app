import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const AboutScreen = () => {
  const showComingSoon = (title) => {
    Alert.alert(title, "This link is for demo only in the project.");
  };

  return (
    // gradient banner
    <View style={styles.container}>
      <LinearGradient
        colors={["#0e67ecff", "#34ebb4ff"]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>About</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* App intro + Features */}
        <View style={styles.card}>
          <Text style={styles.appTitle}>E-Commerce App</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appSubtitle}>
            A modern e-commerce mobile application built with React Native and
            Firebase.
          </Text>

          <Text style={styles.sectionTitle}>Features</Text>
          {[
            "Product catalog with search & filters",
            "Shopping cart & wishlist",
            "Secure checkout process",
            "Order history & tracking",
            "User profile management",
            "Address & payment management",
            "Static help & support screens",
          ].map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureDotOuter}>
                <View style={styles.featureDotInner} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Technology Stack */}
        <View style={styles.card}>
        <Text style={styles.sectionTitle}>Technology Stack</Text>

        <View style={styles.stackRow}>
            <View style={styles.stackLeft}>
            <Ionicons
                name="logo-react"
                size={18}
                color="#0EA5E9"
                style={styles.stackIcon}
            />
            <Text style={styles.stackLabel}>React Native</Text>
            </View>
            <Text style={styles.stackVersion}>0.81.x</Text>
        </View>

        <View style={styles.stackRow}>
            <View style={styles.stackLeft}>
            <Ionicons
                name="rocket-outline"
                size={18}
                color="#6366F1"
                style={styles.stackIcon}
            />
            <Text style={styles.stackLabel}>Expo</Text>
            </View>
            <Text style={styles.stackVersion}>SDK 54</Text>
        </View>

        <View style={styles.stackRow}>
            <View style={styles.stackLeft}>
            <Ionicons
                name="cloud-outline"
                size={18}
                color="#22C55E"
                style={styles.stackIcon}
            />
            <Text style={styles.stackLabel}>Firebase</Text>
            </View>
            <Text style={styles.stackVersion}>Auth + Firestore</Text>
        </View>

        <View style={styles.stackRow}>
            <View style={styles.stackLeft}>
            <Ionicons
                name="swap-horizontal-outline"
                size={18}
                color="#F97316"
                style={styles.stackIcon}
            />
            <Text style={styles.stackLabel}>React Navigation</Text>
            </View>
            <Text style={styles.stackVersion}>v7 (Native Stack + Tabs)</Text>
        </View>
        </View>


        {/* Our Team */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Our Team</Text>

          <View style={styles.teamRow}>
            <View>
              <Text style={styles.teamTitle}>Development Team</Text>
              <Text style={styles.teamSubtitle}>Full-Stack Development</Text>
            </View>
            <Ionicons name="mail-outline" size={18} color="#2563EB" />
          </View>

          <View style={styles.teamRow}>
            <View>
              <Text style={styles.teamTitle}>Design Team</Text>
              <Text style={styles.teamSubtitle}>UI / UX Design</Text>
            </View>
            <Ionicons name="mail-outline" size={18} color="#2563EB" />
          </View>

          <View style={styles.teamRow}>
            <View>
              <Text style={styles.teamTitle}>Support Team</Text>
              <Text style={styles.teamSubtitle}>Customer Support</Text>
            </View>
            <Ionicons name="mail-outline" size={18} color="#2563EB" />
          </View>
        </View>

        {/* Connect With Us */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialItem}
              onPress={() => showComingSoon("Website")}
            >
              <Ionicons name="globe-outline" size={22} color="#2563EB" />
              <Text style={styles.socialLabel}>Website</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialItem}
              onPress={() => showComingSoon("GitHub")}
            >
              <Ionicons name="logo-github" size={22} color="#111827" />
              <Text style={styles.socialLabel}>GitHub</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialItem}
              onPress={() => showComingSoon("Twitter")}
            >
              <Ionicons name="logo-twitter" size={22} color="#0EA5E9" />
              <Text style={styles.socialLabel}>Twitter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialItem}
              onPress={() => showComingSoon("LinkedIn")}
            >
              <Ionicons name="logo-linkedin" size={22} color="#2563EB" />
              <Text style={styles.socialLabel}>LinkedIn</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => showComingSoon("Privacy Policy")}
          >
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => showComingSoon("Terms of Service")}
          >
            <Text style={styles.linkText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          © 2024 E-Commerce App. All rights reserved.
        </Text>
        <Text style={styles.footerSubText}>
          Built with ❤️ using React Native & Firebase.
        </Text>
      </ScrollView>
    </View>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  appVersion: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
    marginBottom: 6,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  featureDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
    backgroundColor: "#22C55E",
  },
  featureText: {
    fontSize: 13,
    color: "#4B5563",
  },

  // Technology Stack rows
  stackRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  stackLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackIcon: {
    marginRight: 8,
  },
  stackLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  stackVersion: {
    fontSize: 13,
    color: "#6B7280", 
    fontWeight: "400",
  },

  // Team
  teamRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  teamTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  teamSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },

  // Social
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  socialItem: {
    alignItems: "center",
    flex: 1,
  },
  socialLabel: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 4,
  },

  // Legal
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 14,
    color: "#2563EB",
  },

  footerText: {
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 8,
  },
  footerSubText: {
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
  },
});
