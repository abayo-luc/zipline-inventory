import { InventorySystem } from "./inventorySystem";
import products from "./data/product.catalog.json";

// mock console.log for testing purposes
console.log = jest.fn();

describe("Inventory System", () => {
  let inventorySystem: InventorySystem;

  describe("Inventory System Initialization", () => {
    it("should create an instance of InventorySystem", () => {
      inventorySystem = new InventorySystem([]);
      expect(inventorySystem).toBeInstanceOf(InventorySystem);
    });

    it("should initialize product catalog correctly with default stock of 0", () => {
      // GIVEN: inventory system program is initialize with products
      inventorySystem = new InventorySystem(products);
      // THEN: it should set stock of each product to zero by default
      products.forEach((product) => {
        const productInfo = inventorySystem.get_product_info(
          product.product_id
        );
        expect(productInfo).toBeDefined();
        expect(productInfo?.stock).toBe(0);
        expect(productInfo?.product_name).toBe(product.product_name);
        expect(productInfo?.mass_g).toBe(product.mass_g);
      });
    });
  });

  describe("Restocking Inventory", () => {
    let processOrderSpy: jest.SpyInstance;
    beforeEach(() => {
      inventorySystem = new InventorySystem(products);
      processOrderSpy = jest.spyOn(inventorySystem, "process_order");
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });
    it("should restock existing products correctly", () => {
      // GIVEN restock payload
      const restockPayload = [
        { product_id: products[0].product_id, quantity: 50 },
        { product_id: products[1].product_id, quantity: 30 },
      ];
      // WHEN restock process is called
      inventorySystem.process_restock(restockPayload);

      // THEN the product stock should be adjusted accordingly
      restockPayload.forEach((item) => {
        const productInfo = inventorySystem.get_product_info(item.product_id);
        expect(productInfo?.stock).toBe(item.quantity);
      });
      expect(processOrderSpy).not.toHaveBeenCalled();
    });

    it("should ignore restocking for non-existing products", () => {
      const restockPayload = [
        { product_id: 9999, quantity: 50 }, // this product don't exist
        { product_id: products[2].product_id, quantity: 20 },
      ];
      inventorySystem.process_restock(restockPayload);

      const nonExistingProductInfo = inventorySystem.get_product_info(9999);
      expect(nonExistingProductInfo).toBeUndefined();

      const existingProductInfo = inventorySystem.get_product_info(
        products[2].product_id
      );
      expect(existingProductInfo?.stock).toBe(20);
      expect(processOrderSpy).not.toHaveBeenCalled();
    });

    it("should set stock to 0 when restocking with nagative quantity", () => {
      const restockPayload = [
        { product_id: products[0].product_id, quantity: -10 },
      ];
      inventorySystem.process_restock(restockPayload);
      const productInfo = inventorySystem.get_product_info(
        products[0].product_id
      );
      expect(productInfo?.stock).toBe(0);
      expect(processOrderSpy).not.toHaveBeenCalled();
    });
  });

  describe("Processing Orders", () => {
    beforeEach(() => {
      inventorySystem = new InventorySystem(products);
      // restock some items for testing
      inventorySystem.process_restock([
        { product_id: products[0].product_id, quantity: 100 },
        { product_id: products[1].product_id, quantity: 50 },
        { product_id: products[2].product_id, quantity: 30 },
      ]);
    });
    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });
    it("should process orders with all items in stock", () => {
      const order = {
        order_id: 1,
        requested: [
          { product_id: products[0].product_id, quantity: 10 },
          { product_id: products[1].product_id, quantity: 5 },
        ],
      };
      inventorySystem.process_order(order);

      expect(
        inventorySystem.get_product_info(products[0].product_id)?.stock
      ).toBe(90);
      expect(
        inventorySystem.get_product_info(products[1].product_id)?.stock
      ).toBe(45);

      expect(console.log).toHaveBeenCalledTimes(8);
      for (let i = 1; i <= 8; i++) {
        expect(console.log).toHaveBeenNthCalledWith(
          i,
          expect.stringMatching(
            /{"order_id":1,"shipped":\[\{"product_id":(0|1),"quantity":\d+\}\]}/
          )
        );
      }
      expect(inventorySystem.pendingOrders.size).toBe(0);
    });

    it("should process orders with some items out of stock and create pending orders", () => {
      // GIVEN: some product are in stock, other we have few quantity, and another we have not stock at all
      const order = {
        order_id: 2,
        requested: [
          { product_id: products[0].product_id, quantity: 95 },
          { product_id: products[1].product_id, quantity: 60 }, // exceeds what we have in stock
          { product_id: products[5].product_id, quantity: 2 }, // not in stock at at all
        ],
      };
      // WHEN: order is placed
      inventorySystem.process_order(order);

      // THEN: the stock should be decreased accordingly
      expect(
        inventorySystem.get_product_info(products[0].product_id)?.stock
      ).toBe(5);
      expect(
        inventorySystem.get_product_info(products[1].product_id)?.stock
      ).toBe(0);
      expect(
        inventorySystem.get_product_info(products[5].product_id)?.stock
      ).toBe(0);
      // AND: missing item should be added to pending orders
      expect(inventorySystem.pendingOrders.size).toBe(1);
      expect(inventorySystem.pendingOrders.get(order.order_id)).toBeDefined();
      expect(inventorySystem.pendingOrders.get(order.order_id)).toEqual(
        expect.arrayContaining([
          { quantity: 10, product_id: products[1].product_id },
          { quantity: 2, product_id: products[5].product_id },
        ])
      );
    });

    it("should fullfil pending orders on product restock", () => {
      // GIVEN there is already placed order, with some pending items
      const order = {
        order_id: 2,
        requested: [
          { product_id: products[1].product_id, quantity: 60 }, // exceeds what we have in stock
          { product_id: products[5].product_id, quantity: 2 }, // not in stock at at all
        ],
      };
      inventorySystem.process_order(order);

      expect(inventorySystem.pendingOrders.size).toBe(1);
      expect(inventorySystem.pendingOrders.get(order.order_id)).toEqual([
        { product_id: 1, quantity: 10 },
        { product_id: 5, quantity: 2 },
      ]);
      // WHEN: we restock items that are pending
      const restockPayload = [
        { product_id: products[1].product_id, quantity: 6 }, // not enough to fullfil the whole pending order
        { product_id: products[5].product_id, quantity: 5 }, // enough to fullfil the order
      ];
      inventorySystem.process_restock(restockPayload);

      // THEN: the pending order should be updated accordingly
      expect(inventorySystem.pendingOrders.size).toBe(1);
      expect(inventorySystem.pendingOrders.get(order.order_id)).toEqual([
        { product_id: 1, quantity: 4 },
      ]);

      // Restock again to fullfil the rest of pending order
      inventorySystem.process_restock([
        { product_id: products[1].product_id, quantity: 10 },
      ]);
      expect(inventorySystem.pendingOrders.size).toBe(0);
    });

    it("should output right shipment data with given test data", () => {
      inventorySystem = new InventorySystem(products);
      const orderPayload = {
        order_id: 123,
        requested: [
          { product_id: 0, quantity: 2 },
          { product_id: 10, quantity: 4 },
        ],
      };
      const restockPayload = [
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
      ];

      // WHEN: order is placed
      inventorySystem.process_order(orderPayload);

      expect(inventorySystem.pendingOrders.size).toBe(1);
      expect(inventorySystem.pendingOrders.get(orderPayload.order_id)).toEqual([
        { product_id: 0, quantity: 2 },
        { product_id: 10, quantity: 4 },
      ]);

      // THEN: restock items
      inventorySystem.process_restock(restockPayload);

      // THEN: the pending order should be fullfiled and removed
      expect(inventorySystem.pendingOrders.size).toBe(0);

      // Check the console.log calls for shipment data
      expect(console.log).toHaveBeenNthCalledWith(
        1,
        '{"order_id":123,"shipped":[{"product_id":0,"quantity":2},{"product_id":10,"quantity":1}]}'
      );
      expect(console.log).toHaveBeenNthCalledWith(
        2,
        '{"order_id":123,"shipped":[{"product_id":10,"quantity":3}]}'
      );
    });
  });
});
