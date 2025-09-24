import { Order, OrderItem, PackageItem, ProductInfo, StockItem } from "./type";

export class InventorySystem {
  private maxPackageSize = 1.8 * 1000; // 1.8kg in grams
  // product_info
  private products: Map<number, ProductInfo> = new Map();
  // stock levels
  private stock: Map<number, number> = new Map();
  // pending orders
  public pendingOrders: Map<number, OrderItem[]> = new Map();

  constructor(products: ProductInfo[]) {
    products.forEach((product) => {
      this.products.set(product.product_id, product);
      // Initialize the stock with zero, set stock to zero by default
      this.stock.set(product.product_id, 0);
    });
  }

  // get product info by id
  get_product_info(
    product_id: number
  ): (ProductInfo & { stock?: number }) | undefined {
    const product = this.products.get(product_id);
    if (product) {
      return {
        ...product,
        stock: this.stock.get(product_id),
      };
    }
  }

  /**
   * Restock the inventory with given payload
   * @param  payload - array of StockItem to restock the inventory
   */
  process_restock(payload: StockItem[]): void {
    const restockedProductIds: number[] = [];
    payload.forEach((item) => {
      // only restock if we already have that product in our catalog
      const previousStock = this.stock.get(item.product_id);
      if (this.products.has(item.product_id) && previousStock !== undefined) {
        this.stock.set(
          item.product_id,
          previousStock + Math.max(item.quantity, 0)
        ); // increase the stock from what we already had
        restockedProductIds.push(item.product_id);
      }
    });
    // After restocking, we could try to fulfill pending orders
    this.fullfil_pending_orders(restockedProductIds);
  }

  /**
   * Process the order, and keep record of none available item to be retried later
   * @param order
   */
  process_order(order: Order): void {
    const availableItems: OrderItem[] = [];
    const pendingOrderItems: Order["requested"] = [];
    order.requested.forEach((orderItem) => {
      const currentStock = this.stock.get(orderItem.product_id) || 0;
      if (orderItem.quantity <= currentStock) {
        availableItems.push(orderItem);
        this.stock.set(orderItem.product_id, currentStock - orderItem.quantity);
      } else if (currentStock > 0 && orderItem.quantity > currentStock) {
        availableItems.push({ ...orderItem, quantity: currentStock });
        this.stock.set(orderItem.product_id, 0);
        pendingOrderItems.push({
          ...orderItem,
          quantity: orderItem.quantity - currentStock,
        });
      } else {
        pendingOrderItems.push(orderItem);
      }
    });

    if (pendingOrderItems.length > 0) {
      this.pendingOrders.set(order.order_id, pendingOrderItems);
    } else if (this.pendingOrders.has(order.order_id)) {
      // if there are no pending items, remove the order from pending orders
      this.pendingOrders.delete(order.order_id);
    }

    const shipments = this.getShipmentBatches(availableItems);
    // for each shipment, call ship_package
    shipments.forEach((shipmentItems) => {
      this.ship_package(
        order.order_id,
        shipmentItems.map((shipment) => ({
          product_id: shipment.product_id,
          quantity: shipment.quantity,
        }))
      );
    });
  }

  /**
   * Log the shipment to the console
   * @param order_id
   * @param items
   */
  ship_package(order_id: number, items: OrderItem[]): void {
    console.log(JSON.stringify({ order_id, shipped: items }));
  }

  /**
   * Trigger the processing of the pending order
   * @param product_ids
   */
  private fullfil_pending_orders(product_ids: number[]): void {
    this.pendingOrders.forEach((orderItems, key) => {
      if (orderItems.some((item) => product_ids.includes(item.product_id))) {
        this.process_order({ order_id: key, requested: orderItems });
      }
    });
  }

  private getShipmentBatches(items: OrderItem[]) {
    // bundle packages into batches that do not exceed maxPackageSize
    const committedBatches: PackageItem[][] = [];

    // temporary hold the current batch of packages
    let currentBatch: PackageItem[] = [];
    let currentBatchMass: number = 0;

    // generate packages per order item that don't exceed maxPackageSize
    const orderPackages = items
      .map((orderItem) => this.splitOrderItemsIntoPackages(orderItem))
      .flat()
      .sort((a, b) => b.unit_mass - a.unit_mass);

    // Group the packages into a single batch which don't exceed the maximum package size
    for (const pkg of orderPackages) {
      if (
        currentBatchMass < this.maxPackageSize &&
        currentBatchMass + pkg.total_mass <= this.maxPackageSize
      ) {
        currentBatch.push(pkg);
        currentBatchMass += pkg.total_mass;
      } else {
        // Get the remaining size in the current batch
        const remainingMassInCurrentBatch =
          this.maxPackageSize - currentBatchMass;
        // Compute the quantity of current package that can fit in the current batch
        const quantityFit = Math.min(
          pkg.quantity,
          Math.floor(remainingMassInCurrentBatch / pkg.unit_mass)
        );

        // Fill in as much quantity in the current batch, before committing
        if (quantityFit > 0) {
          currentBatch.push({
            ...pkg,
            quantity: quantityFit,
            total_mass: pkg.unit_mass * quantityFit,
          });
        }
        // commit the current batch before reset
        committedBatches.push(currentBatch);

        // push the remaining package in the current batch
        const remainingPackageQuantity = pkg.quantity - quantityFit;
        currentBatch = [
          {
            ...pkg,
            quantity: pkg.quantity - quantityFit,
            total_mass: remainingPackageQuantity * pkg.unit_mass,
          },
        ];
        currentBatchMass = remainingPackageQuantity * pkg.unit_mass;
      }
    }

    // For last iteration, push the remaining batch if it has any packages
    if (currentBatch.length > 0) {
      committedBatches.push(currentBatch);
    }

    return committedBatches;
  }

  private splitOrderItemsIntoPackages(item: OrderItem): PackageItem[] {
    const product = this.products.get(item.product_id);
    if (!product) {
      return [];
    }
    const packages: PackageItem[] = [];
    let remainingQuantity = item.quantity;

    while (remainingQuantity > 0) {
      const maxQuantityInPackage = Math.floor(
        this.maxPackageSize / product.mass_g
      );
      // Ensure that we don't ship more than the max allowed in one package
      const quantityForThisPackage = Math.min(
        maxQuantityInPackage,
        remainingQuantity
      );
      packages.push({
        product_id: item.product_id,
        quantity: quantityForThisPackage,
        unit_mass: product.mass_g,
        total_mass: quantityForThisPackage * product.mass_g,
      });
      remainingQuantity -= quantityForThisPackage;
    }

    return packages;
  }
}
