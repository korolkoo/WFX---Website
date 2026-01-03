import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  title: string;
  price: number;
  image_url: string;
  file_url?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: any) => void;
  removeItem: (id: number) => void;
  toggleCart: () => void;
  closeCart: () => void; // (Opcional) Útil se quiser fechar sem limpar
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (existingItem) {
          set({ isOpen: true });
          return; 
        } 
        
        set({
          items: [...currentItems, { 
              id: product.id, 
              title: product.title, 
              price: product.price, 
              image_url: product.image_url,
              file_url: product.file_url,
              quantity: 1 
          }],
          isOpen: true,
        });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      toggleCart: () => set({ isOpen: !get().isOpen }),
      
      // Adicionei essa função utilitária caso precise forçar o fechamento em algum lugar
      closeCart: () => set({ isOpen: false }),

      // --- AQUI ESTÁ A MÁGICA ---
      // Antes: clearCart: () => set({ items: [] }),
      // Agora: Limpa os itens E define isOpen como false
      clearCart: () => set({ items: [], isOpen: false }),

      totalItems: () => get().items.length,
      
      totalPrice: () => get().items.reduce((total, item) => total + item.price, 0),
    }),
    {
      name: 'wfx-cart-storage',
    }
  )
);