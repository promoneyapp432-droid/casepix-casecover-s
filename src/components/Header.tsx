import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, User, Menu, X, Search, Shield, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';
import { useAuthContext } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart } = useStore();
  const { user, isAdmin, signOut, loading } = useAuthContext();
  const navigate = useNavigate();

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 glass border-b border-border/50"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold gradient-text">CasePix</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
              Home
            </Link>
            <Link to="/products" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
              Products
            </Link>
            <Link to="/categories" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
              Categories
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <Search className="w-5 h-5 text-foreground/70" />
            </motion.button>

            {/* Cart */}
            <Link to="/cart">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-foreground/70" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 gradient-coral rounded-full flex items-center justify-center text-xs text-white font-bold">
                    {cartItemCount}
                  </span>
                )}
              </motion.div>
            </Link>

            {/* User Profile */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <div className="w-7 h-7 gradient-primary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium hidden sm:block">{user.name}</span>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="flex items-center gap-2" disabled>
                    <User className="w-4 h-4" />
                    <span>{user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Shield className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="rounded-full">
                  Login
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-secondary transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-border/50"
          >
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="text-foreground/80 hover:text-foreground transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                to="/products"
                onClick={() => setIsMenuOpen(false)}
                className="text-foreground/80 hover:text-foreground transition-colors font-medium"
              >
                Products
              </Link>
              <Link
                to="/categories"
                onClick={() => setIsMenuOpen(false)}
                className="text-foreground/80 hover:text-foreground transition-colors font-medium"
              >
                Categories
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
