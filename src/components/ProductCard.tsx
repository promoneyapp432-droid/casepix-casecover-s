import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl bg-card shadow-card card-hover"
    >
      <Link to={`/product/${product.id}`}>
        {/* Image Container */}
        <div className="aspect-[3/4] relative overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && (
              <Badge className="gradient-coral text-white border-0">
                New
              </Badge>
            )}
            {product.isTopDesign && (
              <Badge className="gradient-primary text-white border-0">
                <Star className="w-3 h-3 mr-1" />
                Top
              </Badge>
            )}
          </div>

          {/* Quick Add Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-3 right-3"
          >
            <Button 
              className="w-full gradient-primary text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              size="sm"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              ₹{product.basePrice}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
