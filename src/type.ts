// product catalog item interface
export interface ProductInfo {
  mass_g: number;
  product_name: string;
  product_id: number;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
}

// for process_order (Order)
export interface Order {
  order_id: number;
  requested: OrderItem[];
}

// for process_restock (restock)
export interface StockItem {
  product_id: number;
  quantity: number;
}
export interface PackageItem {
  product_id: number;
  quantity: number;
  mass: number;
}

// for ship_package
export interface Package {
  order_id: number;
  shipped: OrderItem[];
}
