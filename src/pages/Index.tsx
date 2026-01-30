import { motion } from 'framer-motion';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import CategorySlider from '@/components/CategorySlider';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import { useStore } from '@/context/StoreContext';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { categories, products } = useStore();
  
  const topDesigns = products.filter(p => p.isTopDesign).slice(0, 4);
  const newArrivals = products.filter(p => p.isNew).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Banner */}
      <HeroBanner />

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Shop by Category</h2>
            <p className="text-muted-foreground text-sm mt-1">Find cases that match your vibe</p>
          </div>
          <Link to="/products">
            <Button variant="ghost" size="sm" className="group">
              View All
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
        
        <CategorySlider categories={categories} />
      </section>

      {/* Top Designs Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-primary">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Top Designs</h2>
              <p className="text-muted-foreground mt-1">Most loved by our customers</p>
            </div>
          </div>
          <Link to="/top-designs">
            <Button variant="ghost" className="group">
              See More
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {topDesigns.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-coral">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Newly Added</h2>
              <p className="text-muted-foreground mt-1">Fresh designs just for you</p>
            </div>
          </div>
          <Link to="/new-arrivals">
            <Button variant="ghost" className="group">
              See More
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {newArrivals.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* Category Products Sections */}
      {categories.slice(0, 3).map((category) => {
        const categoryProducts = products.filter(p => p.categoryId === category.id).slice(0, 4);
        if (categoryProducts.length === 0) return null;
        
        return (
          <section key={category.id} className="container mx-auto px-4 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-8"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-secondary text-2xl">
                  {category.icon}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">{category.name}</h2>
                  <p className="text-muted-foreground mt-1">Explore {category.name.toLowerCase()} designs</p>
                </div>
              </div>
              <Link to={`/category/${category.slug}`}>
                <Button variant="ghost" className="group">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categoryProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>
        );
      })}

      {/* CTA Banner */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="gradient-hero rounded-3xl p-8 md:p-12 text-center"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
            Browse our complete collection of stunning phone case designs
          </p>
          <Link to="/products">
            <Button className="btn-coral shadow-lg text-lg px-8 py-6">
              Explore All Products
            </Button>
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
