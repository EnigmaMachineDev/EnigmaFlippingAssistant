import { useStore } from "@/lib/store";

export function useProducts() {
  return useStore((s) => s.products.filter((p) => p.profileId === s.activeProfileId));
}

export function useProduct(id: string) {
  return useStore((s) => s.products.find((p) => p.id === id));
}

export function useProductSales(productId?: string) {
  return useStore((s) => {
    const sales = s.productSales.filter((sale) => sale.profileId === s.activeProfileId);
    return productId ? sales.filter((sale) => sale.productId === productId) : sales;
  });
}

export function useProductActions() {
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const addProductSale = useStore((s) => s.addProductSale);
  const updateProductSale = useStore((s) => s.updateProductSale);
  const deleteProductSale = useStore((s) => s.deleteProductSale);
  return { addProduct, updateProduct, deleteProduct, addProductSale, updateProductSale, deleteProductSale };
}
