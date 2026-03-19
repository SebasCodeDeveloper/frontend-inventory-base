// Modelo para representar una orden
export interface ProductItemRs {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Modelo para representar una orden
export interface OrderDetailRq {
  productId: string;
  quantity: number;
}
