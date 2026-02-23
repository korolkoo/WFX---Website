import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: number;
  title: string;
  price: number;
  image_url: string;
  category: string;
  usage: 'Prototipagem' | 'Borracha';
  file_url?: string;
  zip_url?: string;
  quantity?: number;
}

interface CartStore {
  items: Product[];
  addItem: (item: Product) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  toggleCart: () => void;
  totalItems: () => number;
  cartTotal: () => number;
  discountAmount: () => number;
  finalTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(i => i.id === item.id);
        
        if (existingItem) {
          // Arquivos digitais não precisam de 2 quantidades, mas mantemos a lógica por segurança
          set({ items: currentItems }); 
        } else {
          set({ items: [...currentItems, { ...item, quantity: 1 }], isOpen: true });
        }
      },
      
      removeItem: (id) => {
        set({ items: get().items.filter(item => item.id !== id) });
      },
      
      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      
      totalItems: () => {
        return get().items.reduce((total, item) => total + (item.quantity || 1), 0);
      },
      
      cartTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
      },

      // MÁGICA 1: Calcula qual é o valor exato do desconto
      discountAmount: () => {
        const items = get().items;
        if (items.length === 0) return 0;

        const prices: number[] = [];
        items.forEach(item => {
          for (let i = 0; i < (item.quantity || 1); i++) {
            prices.push(item.price);
          }
        });

        // Ordena do menor para o maior preço
        prices.sort((a, b) => a - b);

        // A cada 4 itens, 1 é grátis. Ex: 4 itens = 1 grátis. 8 itens = 2 grátis.
        const freeItemsCount = Math.floor(prices.length / 4);
        
        let discount = 0;
        // Soma as peças mais baratas como desconto
        for (let i = 0; i < freeItemsCount; i++) {
          discount += prices[i];
        }

        return discount;
      },

      finalTotal: () => {
        return get().cartTotal() - get().discountAmount();
      }
    }),
    {
      name: 'wfx-cart',
    }
  )
);