import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2, ShoppingCart, Star, Check, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BrandModelSelector from '@/components/BrandModelSelector';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProductById, useRelatedProducts } from '@/hooks/useProductById';
import { useAPlusContentByCaseType } from '@/hooks/useAPlusContent';
import { useMobileBrands, useMobileModels } from '@/hooks/useMobileBrands';
import { Database } from '@/integrations/supabase/types';
import { ContentBlock } from '@/types/aplus';

type CaseType = Database['public']['Enums']['case_type'];

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const { data: product, isLoading } = useProductById(productId);
  const { data: relatedProducts = [] } = useRelatedProducts(product?.category_id || undefined, productId);
  const { data: brands } = useMobileBrands();
  const { data: models } = useMobileModels();
  
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedCaseType, setSelectedCaseType] = useState<CaseType>('snap');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Fetch A+ content for selected case type
  const { data: aplusContent } = useAPlusContentByCaseType(selectedCaseType);

  // Get selected variant
  const selectedVariant = product?.product_variants?.find(v => v.case_type === selectedCaseType);
  const displayPrice = aplusContent?.price || selectedVariant?.price || product?.base_price || 0;
  const comparePrice = aplusContent?.compare_price || null;
  const displayTitle = selectedVariant?.title || product?.name || '';
  const displayDescription = selectedVariant?.description || product?.description || '';

  // Build image gallery based on selected case type
  const getProductImages = () => {
    if (!product) return [];
    
    const images: { url: string; caseType?: CaseType }[] = [];
    
    // Get variant images for current case type first
    const snapVariant = product.product_variants?.find(v => v.case_type === 'snap');
    const metalVariant = product.product_variants?.find(v => v.case_type === 'metal');
    
    // Add selected case type's variant image first
    if (selectedCaseType === 'snap' && snapVariant?.image) {
      images.push({ url: snapVariant.image, caseType: 'snap' });
    } else if (selectedCaseType === 'metal' && metalVariant?.image) {
      images.push({ url: metalVariant.image, caseType: 'metal' });
    }
    
    // Add product's main images (these are shared across case types)
    if (product.image) images.push({ url: product.image });
    if (product.image_2) images.push({ url: product.image_2 });
    if (product.image_3) images.push({ url: product.image_3 });
    if (product.image_4) images.push({ url: product.image_4 });
    if (product.image_5) images.push({ url: product.image_5 });
    if (product.image_6) images.push({ url: product.image_6 });
    
    // Add A+ content default images for current case type
    if (aplusContent) {
      if (aplusContent.default_image_2) images.push({ url: aplusContent.default_image_2 });
      if (aplusContent.default_image_3) images.push({ url: aplusContent.default_image_3 });
      if (aplusContent.default_image_4) images.push({ url: aplusContent.default_image_4 });
      if (aplusContent.default_image_5) images.push({ url: aplusContent.default_image_5 });
      if (aplusContent.default_image_6) images.push({ url: aplusContent.default_image_6 });
    }
    
    // Add both variant images at the end for quick switching
    if (selectedCaseType === 'snap' && metalVariant?.image) {
      images.push({ url: metalVariant.image, caseType: 'metal' });
    } else if (selectedCaseType === 'metal' && snapVariant?.image) {
      images.push({ url: snapVariant.image, caseType: 'snap' });
    }
    
    // Remove duplicates based on URL
    const seen = new Set<string>();
    return images.filter(img => {
      if (seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    });
  };
  
  const productImages = getProductImages();
  const currentImage = productImages[selectedImageIndex]?.url || product?.image || '/placeholder.svg';

  // Reset image index when case type changes - show the variant image
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedCaseType]);

  // Get case type info from A+ content or use defaults
  const getCaseTypeInfo = (caseType: CaseType) => {
    const defaultInfo = {
      snap: {
        label: 'Snap Case',
        features: ['Lightweight & slim', 'Easy snap-on installation', 'Scratch-resistant finish']
      },
      metal: {
        label: 'Metal Case',
        features: ['Premium aluminum build', 'Maximum protection', 'Laser-etched design']
      }
    };
    
    return defaultInfo[caseType];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

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
    const brandName = brands?.find(b => b.id === selectedBrand)?.name;
    const modelName = models?.find(m => m.id === selectedModel)?.name;
    toast.success(`Added ${displayTitle} for ${brandName} ${modelName} to cart`);
    // TODO: Implement actual cart functionality with Supabase
  };

  const handleThumbnailClick = (index: number, caseType?: CaseType) => {
    setSelectedImageIndex(index);
    // If clicking on a variant image, also switch case type
    if (caseType && caseType !== selectedCaseType) {
      setSelectedCaseType(caseType);
    }
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
          {/* Product Images - Main + Thumbnails on Right */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="flex gap-4">
              {/* Main Image */}
              <div className="flex-1 aspect-[3/4] rounded-3xl overflow-hidden bg-secondary relative">
                <motion.img
                  key={currentImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={currentImage}
                  alt={displayTitle}
                  className="w-full h-full object-cover"
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.is_new && (
                    <Badge className="gradient-coral text-white border-0 px-4 py-1">
                      New Arrival
                    </Badge>
                  )}
                  {product.is_top_design && (
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
              </div>

              {/* Thumbnails on Right Side */}
              {productImages.length > 1 && (
                <ScrollArea className="w-20 h-[calc(100%)]">
                  <div className="flex flex-col gap-2 pr-2">
                    {productImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleThumbnailClick(idx, img.caseType)}
                        className={cn(
                          "relative w-16 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all",
                          selectedImageIndex === idx
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <img
                          src={img.url}
                          alt={`${displayTitle} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Case type indicator badge */}
                        {img.caseType && (
                          <div className={cn(
                            "absolute bottom-0.5 right-0.5 text-[8px] font-bold px-1 py-0.5 rounded",
                            img.caseType === 'metal' 
                              ? "bg-muted-foreground/80 text-white" 
                              : "bg-primary/80 text-white"
                          )}>
                            {img.caseType === 'metal' ? 'M' : 'S'}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Category */}
            {product.category && (
              <Badge variant="outline" className="mb-2">
                {product.category.icon} {product.category.name}
              </Badge>
            )}

            {/* Title & Price */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{displayTitle}</h1>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-primary">₹{displayPrice}</span>
                {comparePrice && comparePrice > displayPrice && (
                  <span className="text-lg text-muted-foreground line-through">₹{comparePrice}</span>
                )}
              </div>
            </div>

            {/* Case Type Selector */}
            <div className="space-y-3">
              <h3 className="font-semibold">Case Type:</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['snap', 'metal'] as CaseType[]).map((caseType) => {
                  const variant = product.product_variants?.find(v => v.case_type === caseType);
                  const info = getCaseTypeInfo(caseType);
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
                      {/* Variant Image Preview */}
                      {variant?.image && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden mb-2 border border-border">
                          <img 
                            src={variant.image} 
                            alt={info.label} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="font-semibold mb-1">{info.label}</div>
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
            {displayDescription && (
              <p className="text-muted-foreground text-lg">{displayDescription}</p>
            )}

            {/* Features */}
            <div className="space-y-2">
              <h3 className="font-semibold">Features:</h3>
              <ul className="space-y-2">
                {(aplusContent?.features?.length ? aplusContent.features : getCaseTypeInfo(selectedCaseType).features).map((feature, idx) => (
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
              
              <Button 
                className="flex-1"
                variant="secondary"
                onClick={() => {
                  if (!selectedBrand || !selectedModel) {
                    toast.error('Please select your phone model');
                    return;
                  }
                  const brandName = brands?.find(b => b.id === selectedBrand)?.name;
                  const modelName = models?.find(m => m.id === selectedModel)?.name;
                  toast.success(`Proceeding to checkout with ${displayTitle} for ${brandName} ${modelName}`);
                  // TODO: Navigate to checkout
                }}
              >
                Buy Now - ₹{displayPrice * quantity}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* A+ Content Section */}
        {aplusContent && aplusContent.content_blocks?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 space-y-8"
          >
            <h2 className="text-2xl font-bold text-center">Product Details</h2>
            <div className="space-y-8">
              {aplusContent.content_blocks.map((block: ContentBlock, idx: number) => (
                <APlusBlockRenderer key={idx} block={block} />
              ))}
            </div>
          </motion.section>
        )}

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
              {relatedProducts.map((relatedProduct, index) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} index={index} />
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

// A+ Content Block Renderer Component
const APlusBlockRenderer = ({ block }: { block: ContentBlock }) => {
  switch (block.type) {
    case 'title':
      return (
        <div className="text-center">
          <h3 className={cn(
            "font-bold",
            block.size === 'small' && "text-xl md:text-2xl",
            block.size === 'medium' && "text-2xl md:text-3xl",
            block.size === 'large' && "text-3xl md:text-4xl"
          )}>{block.text}</h3>
        </div>
      );
    
    case 'paragraph':
      return (
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-muted-foreground text-lg">{block.text}</p>
        </div>
      );
    
    case 'banner':
      return (
        <div className="rounded-2xl overflow-hidden">
          {block.imageUrl && (
            <img 
              src={block.imageUrl} 
              alt={block.alt || 'Banner'} 
              className="w-full h-auto object-cover"
            />
          )}
        </div>
      );
    
    case 'square_image':
      return (
        <div className="flex justify-center">
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden">
            {block.imageUrl && (
              <img 
                src={block.imageUrl} 
                alt={block.alt || 'Product image'} 
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      );
    
    case 'image_text':
      return (
        <div className={cn(
          "grid md:grid-cols-2 gap-8 items-center",
          block.imagePosition === 'right' && "md:[&>*:first-child]:order-2"
        )}>
          <div className="rounded-2xl overflow-hidden">
            {block.imageUrl && (
              <img 
                src={block.imageUrl} 
                alt={block.alt || 'Feature'} 
                className="w-full h-auto object-cover"
              />
            )}
          </div>
          <div className="space-y-4">
            <p className="text-muted-foreground text-lg">{block.text}</p>
          </div>
        </div>
      );
    
    default:
      return null;
  }
};
