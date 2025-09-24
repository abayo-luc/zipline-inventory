#!/usr/bin/env ./node_modules/.bin/ts-node

import productCatalog from "./data/product.catalog.json";
import { InventorySystem } from "./inventorySystem";

const inventorySystem = new InventorySystem(productCatalog);

// // Restock some inventory
// inventorySystem.process_restock([
//   { product_id: productCatalog[0].product_id, quantity: 100 },
//   { product_id: productCatalog[1].product_id, quantity: 2 },
// ]);

// // Process order
// inventorySystem.process_order({
//   order_id: 1,
//   requested: [
//     { product_id: productCatalog[0].product_id, quantity: 1 },
//     { product_id: productCatalog[1].product_id, quantity: 10 },
//     { product_id: productCatalog[2].product_id, quantity: 13 },
//   ],
// });
// console.log("\n Order process complete \n");
// inventorySystem.process_restock([
//   { product_id: productCatalog[1].product_id, quantity: 10 },
//   { product_id: productCatalog[2].product_id, quantity: 10 },
// ]);
// console.log("\n Restock process complete \n");

// console.log(inventorySystem.pendingOrders.values());

inventorySystem.process_order({
  order_id: 123,
  requested: [
    { product_id: 0, quantity: 2 },
    { product_id: 10, quantity: 4 },
  ],
});

inventorySystem.process_restock([
  { product_id: 0, quantity: 30 },
  { product_id: 1, quantity: 25 },
  { product_id: 2, quantity: 25 },
  { product_id: 3, quantity: 12 },
  { product_id: 4, quantity: 15 },
  { product_id: 5, quantity: 10 },
  { product_id: 6, quantity: 8 },
  { product_id: 7, quantity: 8 },
  { product_id: 8, quantity: 20 },
  { product_id: 9, quantity: 10 },
  { product_id: 10, quantity: 5 },
  { product_id: 11, quantity: 5 },
  { product_id: 12, quantity: 5 },
]);
