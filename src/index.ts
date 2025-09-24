#!/usr/bin/env ./node_modules/.bin/ts-node

import productCatalog from "./data/product.catalog.json";
import { InventorySystem } from "./inventorySystem";

const inventorySystem = new InventorySystem(productCatalog);

// Restock some inventory
inventorySystem.process_restock([
  { product_id: productCatalog[0].product_id, quantity: 100 },
  { product_id: productCatalog[1].product_id, quantity: 2 },
]);

// Process order
inventorySystem.process_order({
  order_id: 1,
  requested: [
    { product_id: productCatalog[0].product_id, quantity: 1 },
    { product_id: productCatalog[1].product_id, quantity: 10 },
    { product_id: productCatalog[2].product_id, quantity: 13 },
  ],
});
console.log("\n Order process complete \n");
inventorySystem.process_restock([
  { product_id: productCatalog[1].product_id, quantity: 10 },
  { product_id: productCatalog[2].product_id, quantity: 10 },
]);
console.log("\n Restock process complete \n");

console.log(inventorySystem.pendingOrders.values());
