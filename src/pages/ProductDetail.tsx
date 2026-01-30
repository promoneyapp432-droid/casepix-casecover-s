import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2, ShoppingCart, Star, Check } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BrandModelSelector from '@/components/BrandModelSelector';
import ProductCard from '@/components/ProductCard';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CaseType, ProductVariant } from '@/types';
import { cn } from '@/lib/utils';

const caseTypeInfo: Record<CaseType, { label: string; features: string[] }> = {
  snap: {
    label: 'Snap Case',
    features: ['Lightweight & slim', 'Easy snap-on installation', 'Scratch-resistant finish']
  },
  metal: {
    label: 'Metal Case',
    features: ['Premium aluminum build', 'Maximum protection', 'Laser-etched design']
  }
};

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, categories, addToCart, brands, models } = useStore();
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedCaseType, setSelectedCaseType] = useState<CaseType>('snap');
  const [quantity, setQuantity] = useState(1);

  const product = products.find(p => p.id === productId);
  const category = product ? categories.find(c => c.id === product.categoryId) : null;
  const relatedProducts = product 
    ? products.filter(p => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4)
    : [];

  // Get selected variant or create default
  const selectedVariant: ProductVariant | null = product?.variants?.find(v => v.caseType === selectedCaseType) || null;
  const displayPrice = selectedVariant?.price || product?.basePrice || 0;
  const displayImage = selectedVariant?.image || product?.image || '';
  const displayTitle = selectedVariant?.title || product?.name || '';
  const displayDescription = selectedVariant?.description || product?.description || '';

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => navigate('/products')}>Browse Products</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedBrand || !selectedModel) {
      toast.error('Please select your phone model');
      return;
    }
    addToCart({
      productId: product.id,
      quantity,
      brandId: selectedBrand,
      modelId: selectedModel,
    });
    const brandName = brands.find(b => b.id === selectedBrand)?.name;
    const modelName = models.find(m => m.id === selectedModel)?.name;
    toast.success(`Added ${displayTitle} for ${brandName} ${modelName} to cart`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-secondary">
              <img
                src={displayImage}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isNew && (
                <Badge className="gradient-coral text-white border-0 px-4 py-1">
                  New Arrival
                </Badge>
              )}
              {product.isTopDesign && (
                <Badge className="gradient-primary text-white border-0 px-4 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Top Design
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button size="icon" variant="secondary" className="rounded-full">
                <Heart className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Category */}
            {category && (
              <Badge variant="outline" className="mb-2">
                {category.icon} {category.name}
              </Badge>
            )}

            {/* Title & Price */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{displayTitle}</h1>
              <p className="text-2xl font-bold text-primary">₹{displayPrice}</p>
            </div>

            {/* Case Type Selector - Amazon Style */}
            <div className="space-y-3">
              <h3 className="font-semibold">Case Type:</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['snap', 'metal'] as CaseType[]).map((caseType) => {
                  const variant = product.variants?.find(v => v.caseType === caseType);
                  const info = caseTypeInfo[caseType];
                  const price = variant?.price || product.basePrice;
                  const isSelected = selectedCaseType === caseType;
                  
                  return (
                    <button
                      key={caseType}
                      onClick={() => setSelectedCaseType(caseType)}
                      className={cn(
                        "relative p-4 rounded-xl border-2 text-left transition-all",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className="font-semibold mb-1">{info.label}</div>
                      <div className="text-lg font-bold text-primary">₹{price}</div>
                      <ul className="mt-2 space-y-1">
                        {info.features.slice(0, 2).map((feature, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                            <Check className="w-3 h-3 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-lg">{displayDescription}</p>

            {/* Features */}
            <div className="space-y-2">
              <h3 className="font-semibold">Features:</h3>
              <ul className="space-y-2">
                {caseTypeInfo[selectedCaseType].features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {feature}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-primary" />
                  Precise cutouts for ports
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-primary" />
                  Wireless charging compatible
                </li>
              </ul>
            </div>

            {/* Phone Selector */}
            <BrandModelSelector
              onSelect={(brandId, modelId) => {
                setSelectedBrand(brandId);
                setSelectedModel(modelId);
              }}
              selectedBrandId={selectedBrand}
              selectedModelId={selectedModel}
              caseType={selectedCaseType}
            />

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <Button 
                className="flex-1 btn-gradient"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart - ₹{displayPrice * quantity}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </motion.section>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;