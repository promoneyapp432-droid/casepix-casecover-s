import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  index: number;
}

const CategoryCard = ({ category, index }: CategoryCardProps) => {
  return (
    <Link to={`/category/${category.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.05 }}
        className="group relative overflow-hidden rounded-2xl bg-card shadow-card card-hover cursor-pointer"
      >
        <div className="aspect-square p-6 flex flex-col items-center justify-center gap-4">
          {/* Icon Background */}
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
            {category.icon}
          </div>
          
          {/* Category Name */}
          <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
            {category.name}
          </h3>
        </div>
        
        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </motion.div>
    </Link>
  );
};

export default CategoryCard;
