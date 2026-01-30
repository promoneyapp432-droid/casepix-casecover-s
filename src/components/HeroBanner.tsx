import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';

const HeroBanner = () => {
  const { banners } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Auto-slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="relative overflow-hidden rounded-3xl mx-4 my-6">
      <div className="aspect-[21/9] md:aspect-[3/1] relative">
        <AnimatePresence mode="wait">
          {banners.map((banner, index) => (
            currentSlide === index && (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 gradient-hero"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/20 to-transparent" />
                <div className="relative z-10 h-full flex items-center">
                  <div className="container mx-auto px-8 md:px-16">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="max-w-lg"
                    >
                      <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        {banner.title}
                      </h1>
                      <p className="text-lg md:text-xl text-white/90 mb-6">
                        {banner.subtitle}
                      </p>
                      <Link to={banner.ctaLink}>
                        <Button className="btn-coral shadow-lg">
                          {banner.ctaText}
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
                </div>
                {/* Decorative Phone Cases */}
                <div className="absolute right-8 md:right-20 top-1/2 -translate-y-1/2 hidden md:block">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-32 h-64 bg-white/20 backdrop-blur-sm rounded-3xl border border-white/30 shadow-2xl"
                  />
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="absolute top-8 -left-16 w-28 h-56 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl"
                  />
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index 
                  ? 'w-8 bg-white' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
