import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    console.log({storagedCart});
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const filterProducts = (product:Product) => product.id === productId;
      const currentProduct = cart.filter(filterProducts);
      
      if(currentProduct.length) {
        updateProductAmount({productId, amount: currentProduct[0].amount + 1});
      }else {
        const {data} = await api.get('/products');
        const currentProduct = data.filter(filterProducts)[0];
  
        const updateCart = Object.assign(currentProduct, {amount: 1})
        setCart(old => [...old, updateCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
      }
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updateCart = cart.filter((p: Product) => p.id !== productId);
      setCart(updateCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const {data} = await api.get(`/stock/${productId}`);

      if(amount <= data.amount){
        const updateCart = cart.map((product: Product) => product.id === productId ? Object.assign(product, {amount: amount}): product);
        setCart(updateCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      }else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
