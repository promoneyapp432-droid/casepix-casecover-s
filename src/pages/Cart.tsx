import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';

const Cart = () => {
  const { cart, products, brands, models, removeFromCart, addToCart } = useStore();

  const getProduct = (productId: string) => products.find(p => p.id === productId);
  const getBrand = (brandId: string) => brands.find(b => b.id === brandId);
  const getModel = (modelId: string) => models.find(m => m.id === modelId);

  const cartItems = cart.map(item => ({
    ...item,
    product: getProduct(item.productId),
    brand: getBrand(item.brandId),
    model: getModel(item.modelId),
  }));

  const total = cartItems.reduce((acc, item) => {
    return acc + (item.product?.basePrice || 0) * item.quantity;
  }, 0);

  const updateQuantity = (productId: string, delta: number) => {
    const item = cart.find(c => c.productId === productId);
    if (item) {
      if (item.quantity + delta <= 0) {
        removeFromCart(productId);
      } else {
        addToCart({ ...item, quantity: delta });
      }
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added anything to your cart yet
            </p>
            <Link to="/products">
              <Button className="btn-gradient">
                Start Shopping
              </Button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8"
        >
          Shopping Cart
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 p-4 rounded-2xl bg-card border"
              >
                <img
                  src={item.product?.image || '/placeholder.svg'}
                  alt={item.product?.name}
                  className="w-24 h-24 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.product?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.brand?.name} {item.model?.name}
                  </p>
                  <p className="text-primary font-bold mt-1">₹{item.product?.basePrice}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.productId, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.productId, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="rounded-2xl bg-card border p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-primary">Free</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              </div>

              <Button className="w-full btn-gradient">
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Link to="/products">
                <Button variant="ghost" className="w-full mt-3">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
