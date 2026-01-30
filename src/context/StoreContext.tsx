import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Category, 
  MobileBrand, 
  MobileModel, 
  Product, 
  User, 
  Order, 
  CartItem,
  BannerSlide 
} from '@/types';
import { 
  categories as initialCategories,
  mobileBrands as initialBrands,
  mobileModels as initialModels,
  products as initialProducts,
  bannerSlides as initialBanners,
  mockUsers,
  mockOrders 
} from '@/data/mockData';

interface StoreContextType {
  // Data
  categories: Category[];
  brands: MobileBrand[];
  models: MobileModel[];
  products: Product[];
  banners: BannerSlide[];
  users: User[];
  orders: Order[];
  cart: CartItem[];
  currentUser: User | null;
  
  // Category Actions
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Brand Actions
  addBrand: (brand: MobileBrand) => void;
  updateBrand: (id: string, brand: Partial<MobileBrand>) => void;
  deleteBrand: (id: string) => void;
  
  // Model Actions
  addModel: (model: MobileModel) => void;
  updateModel: (id: string, model: Partial<MobileModel>) => void;
  deleteModel: (id: string) => void;
  
  // Product Actions
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Order Actions
  updateOrderStatus: (id: string, status: Order['status']) => void;
  
  // Cart Actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  // Auth Actions
  login: (user: User) => void;
  logout: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [brands, setBrands] = useState<MobileBrand[]>(initialBrands);
  const [models, setModels] = useState<MobileModel[]>(initialModels);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [banners] = useState<BannerSlide[]>(initialBanners);
  const [users] = useState<User[]>(mockUsers as User[]);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Category Actions
  const addCategory = (category: Category) => {
    setCategories([...categories, category]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  // Brand Actions
  const addBrand = (brand: MobileBrand) => {
    setBrands([...brands, brand]);
  };

  const updateBrand = (id: string, updates: Partial<MobileBrand>) => {
    setBrands(brands.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBrand = (id: string) => {
    setBrands(brands.filter(b => b.id !== id));
    setModels(models.filter(m => m.brandId !== id));
  };

  // Model Actions
  const addModel = (model: MobileModel) => {
    setModels([...models, model]);
  };

  const updateModel = (id: string, updates: Partial<MobileModel>) => {
    setModels(models.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteModel = (id: string) => {
    setModels(models.filter(m => m.id !== id));
  };

  // Product Actions
  const addProduct = (product: Product) => {
    setProducts([...products, product]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Order Actions
  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };

  // Cart Actions
  const addToCart = (item: CartItem) => {
    const existing = cart.find(c => c.productId === item.productId);
    if (existing) {
      setCart(cart.map(c => 
        c.productId === item.productId 
          ? { ...c, quantity: c.quantity + item.quantity }
          : c
      ));
    } else {
      setCart([...cart, item]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Auth Actions
  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <StoreContext.Provider
      value={{
        categories,
        brands,
        models,
        products,
        banners,
        users,
        orders,
        cart,
        currentUser,
        addCategory,
        updateCategory,
        deleteCategory,
        addBrand,
        updateBrand,
        deleteBrand,
        addModel,
        updateModel,
        deleteModel,
        addProduct,
        updateProduct,
        deleteProduct,
        updateOrderStatus,
        addToCart,
        removeFromCart,
        clearCart,
        login,
        logout,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
