import React, { useEffect, useState, useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase";

// screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import ProductDetailScreen from "./screens/ProductDetailScreen";
import CartScreen from "./screens/CartScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import ProfileScreen from "./screens/ProfileScreen";
import OrderHistoryScreen from "./screens/OrderHistoryScreen";
import OrderTrackingScreen from "./screens/OrderTrackingScreen";
import AddressScreen from "./screens/AddressScreen";
import PaymentMethodsScreen from "./screens/PaymentMethodsScreen";
import WishlistScreen from "./screens/WishlistScreen";
import AboutScreen from "./screens/AboutScreen";
import HelpSupportScreen from "./screens/HelpSupportScreen";
import NotificationsScreen from "./screens/NotificationsScreen";

import { CartProvider, CartContext } from "./contexts/CartContext";

import { Ionicons } from "@expo/vector-icons";
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';

// import for notification
import {
  registerForPushNotificationsAsync,
  saveMyPushToken,
} from "./services/notifications";

import { Platform } from "react-native";

if (Platform.OS === "web") {
  require("./app.web.css");
}



const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator(); 
const CartStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Stack: Login + Register
const AuthStackNavigator = () => (
  <AuthStack.Navigator>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Home stack (HomeList + ProductDetail)
const HomeStackNavigator = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen
      name="HomeList"
      component={HomeScreen}
      options={{ title: "Products" }}
    />
    <HomeStack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: "Product Details" }}
    />
  </HomeStack.Navigator>
);

// Cart stack: cart + checkout
const CartStackNavigator = () => (
  <CartStack.Navigator>
    <CartStack.Screen
      name="CartMain"
      component={CartScreen}
      options={{ title: "Cart" }}
    />
    <CartStack.Screen
      name="Checkout"
      component={CheckoutScreen}
      options={{ title: "Checkout" }}
    />
  </CartStack.Navigator>
);

// Profile stack: Profile menu + Orders + order tracking + Addresses + Payments
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ title: "Profile" }}
    />
    <ProfileStack.Screen
      name="OrderHistory"
      component={OrderHistoryScreen}
      options={{ title: "My Orders" }}
    />
    <ProfileStack.Screen
      name="OrderTracking"
      component={OrderTrackingScreen}
      options={{ title: "Track Order" }}
    />
     <ProfileStack.Screen
      name="Wishlist"
      component={WishlistScreen}
      options={{ title: "My Wishlist" }}
    />
    <ProfileStack.Screen
      name="Address"
      component={AddressScreen}
      options={{ title: "Addresses" }}
    />
    <ProfileStack.Screen
      name="PaymentMethods"
      component={PaymentMethodsScreen}
      options={{ title: "Payment Methods" }}
    />
    <ProfileStack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: "Notifications" }}
    />
    <ProfileStack.Screen
      name="About"
      component={AboutScreen}
      options={{ title: "About" }}
    />
    <ProfileStack.Screen
      name="HelpSupport"
      component={HelpSupportScreen}
      options={{ title: "Help & Support" }}
    />
  </ProfileStack.Navigator>
);

// Bottom Tabs: Home + Cart + profile
const MainTabs = () => {
  // total item in cart
  const { totalItems } = useContext(CartContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Cart") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          height: Platform.OS === "web" ? 60 : 60,
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },

        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: Platform.OS === "web" ? 4 : 0,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />

      <Tab.Screen
        name="Cart"
        component={CartStackNavigator}
        options={{
          // if item show badge, if no hide
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
        }}
      />

      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
  });
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // onAuthStateChanged subcribe a listener( this listener use to listen if user login or logout (change state) and exist until app reload or turn off-> call unsub function to remove listener)
  // unsub = onAuthStateChanged() is a function to remove that listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setChecking(false);
    });

    // cleanup when unmount
    return unsub;
  }, []);


  // ===== Register push notification token automatically after user logs in
  useEffect(() => {
    if (Platform.OS === "web") return; //use for web

    // Flag to prevent actions after component unmounts
    let mounted = true;

    // Initialize push notification registration
    const initPush = async () => {
      // Only register push notifications when a user is logged in
      if (!user) return;

      try {
        // Request notification permission and get Expo push token
        const token = await registerForPushNotificationsAsync();
        if (!mounted) return;

        // Save the push token to Firestore for this user
        await saveMyPushToken(token);

        console.log("Expo push token:", token);
      } catch (e) {
        console.log("Push init error:", e);
      }
    };

    // Run push registration when the user state changes
    initPush();

    // Cleanup function to avoid async side effects after unmount
    return () => {
      mounted = false;
    };
  }, [user]); // Re-run when authentication state (user) changes


  if (checking) return null;
  if (!fontsLoaded) {
    return null;
  }

  return (
    <CartProvider>
      {Platform.OS === "web" ? (
        <div className="web-shell">
          <div className="web-content">
            <NavigationContainer>
              <RootStack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                  <RootStack.Screen name="Main" component={MainTabs} />
                ) : (
                  <RootStack.Screen name="Auth" component={AuthStackNavigator} />
                )}
              </RootStack.Navigator>
            </NavigationContainer>
          </div>
        </div>
      ) : (
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
              <RootStack.Screen name="Main" component={MainTabs} />
            ) : (
              <RootStack.Screen name="Auth" component={AuthStackNavigator} />
            )}
          </RootStack.Navigator>
        </NavigationContainer>
      )}
    </CartProvider>
  );

}