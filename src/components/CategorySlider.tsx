import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category } from '@/types';

interface CategorySliderProps {
  categories: Category[];
}

const CategorySlider = ({ categories }: CategorySliderProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 200;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Split categories into 2 rows
  const midPoint = Math.ceil(categories.length / 2);
  const row1 = categories.slice(0, midPoint);
  const row2 = categories.slice(midPoint);

  return (
    <div className="relative group">
      {/* Navigation Buttons */}
      <Button
        variant="outline"
        size="icon"
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg bg-background"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg bg-background"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* Slider Container */}
      <div
        ref={sliderRef}
        className="overflow-x-auto scrollbar-hide scroll-smooth"
      >
        <div className="flex flex-col gap-3 min-w-max pb-2">
          {/* Row 1 */}
          <div className="flex gap-3">
            {row1.map((category, index) => (
              <CategoryItem key={category.id} category={category} index={index} />
            ))}
          </div>
          
          {/* Row 2 */}
          <div className="flex gap-3">
            {row2.map((category, index) => (
              <CategoryItem key={category.id} category={category} index={index + midPoint} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CategoryItemProps {
  category: Category;
  index: number;
}

const CategoryItem = ({ category, index }: CategoryItemProps) => {
  return (
    <Link to={`/category/${category.slug}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl shadow-sm border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer min-w-[140px]"
      >
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="w-10 h-10 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-xl shrink-0">
            {category.icon}
          </div>
        )}
        <span className="font-medium text-sm text-card-foreground whitespace-nowrap">
          {category.name}
        </span>
      </motion.div>
    </Link>
  );
};

export default CategorySlider;
