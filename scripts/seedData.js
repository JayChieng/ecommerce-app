// create private app and db, cannot use same from firebase.js in Node package firebase/auth doesn't export getReactNativePersistence --> scipt seed crashed
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3Uk02QjFHakR5AirMzgzaj2xtu14JoVQ",
  authDomain: "ecommerce-app-680a3.firebaseapp.com",
  projectId: "ecommerce-app-680a3",
  storageBucket: "ecommerce-app-680a3.firebasestorage.app",
  messagingSenderId: "235289853400",
  appId: "1:235289853400:web:4390f213ac90b0fa8bc6ad"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app); //db for only seeddata


const sampleProducts = [
  // ELECTRONICS
  {
    name: "iPhone 15 Pro",
    description: "The most advanced iPhone with titanium design and A17 Pro chip.",
    price: 999,
    originalPrice: 1099,
    category: "Electronics",
    imageUrl:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviewsCount: 1247,
    features: [
      "Titanium design",
      "A17 Pro chip",
      "48MP camera system",
      "USB-C connectivity"
    ],
    reviews: [
      {
        name: "John Doe",
        rating: 5,
        comment: "Amazing phone! The camera quality is outstanding."
      },
      {
        name: "Jane Smith",
        rating: 4,
        comment: "Great performance, but battery could be better."
      },
      {
        name: "Alex Nguyen",
        rating: 5,
        comment: "Super smooth and fast. Totally worth the upgrade."
      }
    ],
    inStock: true
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description: "Premium Android smartphone with S Pen and advanced AI camera.",
    price: 1199,
    originalPrice: 1299,
    category: "Electronics",
    imageUrl:
    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reviewsCount: 980,
    features: [
      "S Pen support",
      "Periscope zoom camera",
      "120Hz AMOLED display"
    ],
    reviews: [
      {
        name: "Maria Lopez",
        rating: 5,
        comment: "Best Android phone I've used so far!"
      },
      {
        name: "Daniel Park",
        rating: 4,
        comment: "Camera is insane, but a bit heavy in hand."
      }
    ],
    inStock: true
  },
  {
    name: "Sony WH-1000XM5",
    description: "Wireless noise-cancelling headphones with long battery life.",
    price: 499,
    originalPrice: 549,
    category: "Electronics",
    imageUrl:
    "https://tse4.mm.bing.net/th/id/OIP.OyDkaG1nOKJv--fWEMAriAHaEw?rs=1&pid=ImgDetMain&o=7&rm=3",
    rating: 4.8,
    reviewsCount: 2103,
    features: [
      "Industry-leading noise cancellation",
      "Up to 30 hours of battery life",
      "Comfortable over-ear design"
    ],
    reviews: [
      {
        name: "Kevin Tran",
        rating: 5,
        comment: "Perfect for studying and traveling."
      }
    ],
    inStock: true
  },

  // CLOTHING
  {
    name: "Levi's 501 Original Jeans",
    description: "Classic straight-fit jeans in authentic denim.",
    price: 89,
    originalPrice: 99,
    category: "Clothing",
    imageUrl:
    "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
    rating: 4.6,
    reviewsCount: 654,
    features: [
      "100% cotton denim",
      "Straight fit",
      "Button fly",
      "Classic 5-pocket styling"
    ],
    reviews: [
      {
        name: "Emma Davis",
        rating: 5,
        comment: "Great fit and very durable."
      }
    ],
    inStock: true
  },
  {
    name: "Nike Club Fleece Hoodie",
    description: "Soft fleece hoodie with adjustable drawstring and pocket.",
    price: 75,
    originalPrice: 85,
    category: "Clothing",
    imageUrl:
    "https://www.sportchek.ca/api/v1/product/api/v1/product/image/334452401?baseStoreId=SC&lang=en_CA&subscription-key=c01ef3612328420c9f5cd9277e815a0e&imwidth=1244&impolicy=gZoom",
    rating: 4.4,
    reviewsCount: 432,
    features: [
      "Warm fleece material",
      "Regular fit",
      "Kangaroo pocket"
    ],
    reviews: [
      {
        name: "Liam Brown",
        rating: 4,
        comment: "Very comfy, I wear it almost every day."
      }
    ],
    inStock: true
  },
  {
    name: "Adidas Ultraboost 22",
    description: "Responsive running shoes with Boost midsole and Primeknit.",
    price: 180,
    originalPrice: 199,
    category: "Clothing",
    imageUrl:
    "https://tse3.mm.bing.net/th/id/OIP.zV6DAT6Io3LO36djD3wWtwHaFM?rs=1&pid=ImgDetMain&o=7&rm=3",
    rating: 4.7,
    reviewsCount: 1120,
    features: [
      "Boost cushioning",
      "Breathable upper",
      "Supportive heel counter"
    ],
    reviews: [
      {
        name: "Sophia Lee",
        rating: 5,
        comment: "Perfect for running and walk around campus."
      }
    ],
    inStock: true
  },

  // BOOKS
  {
    name: "Clean Code",
    description: "A handbook of agile software craftsmanship.",
    price: 55,
    originalPrice: 65,
    category: "Books",
    imageUrl:
    "https://tse3.mm.bing.net/th/id/OIP.ZfYHb383Tk0kUMP-XsfWegHaJI?rs=1&pid=ImgDetMain&o=7&rm=3",
    rating: 4.8,
    reviewsCount: 3200,
    features: [
      "Best practices for writing clean code",
      "Real-world Java examples",
      "Written by Robert C. Martin"
    ],
    reviews: [
      {
        name: "Michael Chen",
        rating: 5,
        comment: "Must-read for every developer."
      }
    ],
    inStock: true
  },
  {
    name: "Atomic Habits",
    description: "Practical guide to building good habits and breaking bad ones.",
    price: 32,
    originalPrice: 40,
    category: "Books",
    imageUrl:
    "https://tse1.mm.bing.net/th/id/OIP.HK-7l22ljAkinverkN0VtQHaEs?rs=1&pid=ImgDetMain&o=7&rm=3",
    rating: 4.9,
    reviewsCount: 5400,
    features: [
      "Easy-to-apply frameworks",
      "Real life examples",
      "Focus on small daily improvements"
    ],
    reviews: [
      {
        name: "Olivia Wilson",
        rating: 5,
        comment: "Changed the way I think about habits."
      }
    ],
    inStock: true
  },
  {
    name: "Harry Potter and the Philosopher's Stone",
    description: "The first book in the Harry Potter series.",
    price: 29,
    originalPrice: 35,
    category: "Books",
    imageUrl:
    "https://tse2.mm.bing.net/th/id/OIP.4T6mm2F2sn1wM8cJFUIbKAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
    rating: 4.8,
    reviewsCount: 8900,
    features: [
      "Fantasy adventure",
      "Great for young readers",
      "Start of the Harry Potter saga"
    ],
    reviews: [
      {
        name: "Noah Martin",
        rating: 5,
        comment: "Magical and fun. A classic."
      }
    ],
    inStock: true
  }
];

export const seedProducts = async () => {
  for (const product of sampleProducts) {
    await addDoc(collection(db, "products"), product);
  }
};

export default seedProducts;
