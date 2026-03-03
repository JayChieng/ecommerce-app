// cmd: node seedDatabase.js to upload products to firebase

import { seedProducts } from "./scripts/seedData.js";

console.log("Starting to seed database with products...");

seedProducts()
  .then(() => {
    console.log("Database seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });