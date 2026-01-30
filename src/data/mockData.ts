import { Category, MobileBrand, MobileModel, Product, BannerSlide } from '@/types';

// Import product images
import animeNaruto from '@/assets/products/anime-naruto.jpg';
import animeAot from '@/assets/products/anime-aot.jpg';
import travelParis from '@/assets/products/travel-paris.jpg';
import marvelIronman from '@/assets/products/marvel-ironman.jpg';
import heroBanner from '@/assets/hero-banner.jpg';

export const categories: Category[] = [
  { id: '1', name: 'Anime', slug: 'anime', icon: '🎌', image: animeNaruto },
  { id: '2', name: 'Travel', slug: 'travel', icon: '✈️', image: travelParis },
  { id: '3', name: 'Marvel', slug: 'marvel', icon: '🦸', image: marvelIronman },
  { id: '4', name: 'Nature', slug: 'nature', icon: '🌿', image: '/placeholder.svg' },
  { id: '5', name: 'Abstract', slug: 'abstract', icon: '🎨', image: '/placeholder.svg' },
  { id: '6', name: 'Gaming', slug: 'gaming', icon: '🎮', image: '/placeholder.svg' },
];

export const mobileBrands: MobileBrand[] = [
  { id: '1', name: 'Apple' },
  { id: '2', name: 'Samsung' },
  { id: '3', name: 'OnePlus' },
  { id: '4', name: 'Google Pixel' },
  { id: '5', name: 'Xiaomi' },
  { id: '6', name: 'Realme' },
  { id: '7', name: 'Oppo' },
  { id: '8', name: 'Vivo' },
];

export const mobileModels: MobileModel[] = [
  // Apple
  { id: '1', brandId: '1', name: 'iPhone 15 Pro Max' },
  { id: '2', brandId: '1', name: 'iPhone 15 Pro' },
  { id: '3', brandId: '1', name: 'iPhone 15' },
  { id: '4', brandId: '1', name: 'iPhone 14 Pro Max' },
  { id: '5', brandId: '1', name: 'iPhone 14 Pro' },
  { id: '6', brandId: '1', name: 'iPhone 14' },
  { id: '7', brandId: '1', name: 'iPhone 13' },
  // Samsung
  { id: '8', brandId: '2', name: 'Galaxy S24 Ultra' },
  { id: '9', brandId: '2', name: 'Galaxy S24+' },
  { id: '10', brandId: '2', name: 'Galaxy S24' },
  { id: '11', brandId: '2', name: 'Galaxy S23 Ultra' },
  { id: '12', brandId: '2', name: 'Galaxy Z Fold 5' },
  { id: '13', brandId: '2', name: 'Galaxy Z Flip 5' },
  // OnePlus
  { id: '14', brandId: '3', name: 'OnePlus 12' },
  { id: '15', brandId: '3', name: 'OnePlus 11' },
  { id: '16', brandId: '3', name: 'OnePlus Nord 3' },
  // Google Pixel
  { id: '17', brandId: '4', name: 'Pixel 8 Pro' },
  { id: '18', brandId: '4', name: 'Pixel 8' },
  { id: '19', brandId: '4', name: 'Pixel 7 Pro' },
  // Xiaomi
  { id: '20', brandId: '5', name: 'Xiaomi 14 Pro' },
  { id: '21', brandId: '5', name: 'Xiaomi 14' },
  { id: '22', brandId: '5', name: 'Redmi Note 13 Pro' },
  // Realme
  { id: '23', brandId: '6', name: 'Realme GT 5' },
  { id: '24', brandId: '6', name: 'Realme 11 Pro+' },
  // Oppo
  { id: '25', brandId: '7', name: 'Oppo Find X7 Ultra' },
  { id: '26', brandId: '7', name: 'Oppo Reno 11 Pro' },
  // Vivo
  { id: '27', brandId: '8', name: 'Vivo X100 Pro' },
  { id: '28', brandId: '8', name: 'Vivo V30 Pro' },
];

export const products: Product[] = [
  // Anime
  { 
    id: '1', 
    name: 'Naruto Sage Mode', 
    description: 'Premium anime case featuring Naruto in Sage Mode', 
    basePrice: 499, 
    image: animeNaruto, 
    categoryId: '1', 
    isTopDesign: true, 
    isNew: false, 
    createdAt: '2025-01-20',
    variants: [
      { id: 'v1-1', productId: '1', caseType: 'snap', title: 'Naruto Sage Mode - Snap Case', description: 'Lightweight snap-on protection with vibrant print', price: 499, image: animeNaruto, stock: 50 },
      { id: 'v1-2', productId: '1', caseType: 'metal', title: 'Naruto Sage Mode - Metal Case', description: 'Premium aluminum case with laser-etched design', price: 799, image: animeNaruto, stock: 30 }
    ]
  },
  { 
    id: '2', 
    name: 'Attack on Titan', 
    description: 'Epic AOT design with Survey Corps logo', 
    basePrice: 549, 
    image: animeAot, 
    categoryId: '1', 
    isTopDesign: true, 
    isNew: true, 
    createdAt: '2025-01-28',
    variants: [
      { id: 'v2-1', productId: '2', caseType: 'snap', title: 'AOT - Snap Case', description: 'Lightweight snap-on protection', price: 549, image: animeAot, stock: 40 },
      { id: 'v2-2', productId: '2', caseType: 'metal', title: 'AOT - Metal Case', description: 'Premium metal protection', price: 849, image: animeAot, stock: 25 }
    ]
  },
  { id: '3', name: 'Demon Slayer Tanjiro', description: 'Water breathing Tanjiro artwork', basePrice: 599, image: animeNaruto, categoryId: '1', isTopDesign: false, isNew: true, createdAt: '2025-01-29' },
  { id: '4', name: 'One Piece Luffy Gear 5', description: 'Luffy Gear 5 transformation design', basePrice: 649, image: animeAot, categoryId: '1', isTopDesign: true, isNew: true, createdAt: '2025-01-30' },
  
  // Travel
  { id: '5', name: 'Paris Eiffel Tower', description: 'Beautiful Paris cityscape at sunset', basePrice: 449, image: travelParis, categoryId: '2', isTopDesign: true, isNew: false, createdAt: '2025-01-15' },
  { id: '6', name: 'Santorini Greece', description: 'Stunning blue domes of Santorini', basePrice: 499, image: travelParis, categoryId: '2', isTopDesign: false, isNew: true, createdAt: '2025-01-27' },
  { id: '7', name: 'Tokyo Night Lights', description: 'Neon-lit streets of Tokyo', basePrice: 549, image: travelParis, categoryId: '2', isTopDesign: true, isNew: false, createdAt: '2025-01-10' },
  
  // Marvel
  { id: '8', name: 'Iron Man Arc Reactor', description: 'Glowing arc reactor design', basePrice: 599, image: marvelIronman, categoryId: '3', isTopDesign: true, isNew: false, createdAt: '2025-01-18' },
  { id: '9', name: 'Spider-Man Web', description: 'Web-slinging Spider-Man artwork', basePrice: 549, image: marvelIronman, categoryId: '3', isTopDesign: true, isNew: true, createdAt: '2025-01-26' },
  { id: '10', name: 'Black Panther Wakanda', description: 'Wakanda Forever tribute design', basePrice: 649, image: marvelIronman, categoryId: '3', isTopDesign: false, isNew: false, createdAt: '2025-01-12' },
  
  // Nature
  { id: '11', name: 'Mountain Sunrise', description: 'Breathtaking mountain sunrise view', basePrice: 399, image: travelParis, categoryId: '4', isTopDesign: false, isNew: true, createdAt: '2025-01-29' },
  { id: '12', name: 'Ocean Waves', description: 'Calming ocean wave pattern', basePrice: 449, image: travelParis, categoryId: '4', isTopDesign: true, isNew: false, createdAt: '2025-01-14' },
  
  // Abstract
  { id: '13', name: 'Geometric Fusion', description: 'Modern geometric art design', basePrice: 479, image: animeAot, categoryId: '5', isTopDesign: true, isNew: true, createdAt: '2025-01-28' },
  { id: '14', name: 'Fluid Colors', description: 'Mesmerizing fluid art pattern', basePrice: 499, image: animeNaruto, categoryId: '5', isTopDesign: false, isNew: false, createdAt: '2025-01-16' },
  
  // Gaming
  { id: '15', name: 'Cyberpunk City', description: 'Futuristic cyberpunk cityscape', basePrice: 549, image: marvelIronman, categoryId: '6', isTopDesign: true, isNew: true, createdAt: '2025-01-30' },
  { id: '16', name: 'Retro Gaming', description: 'Classic retro gaming icons', basePrice: 449, image: animeNaruto, categoryId: '6', isTopDesign: false, isNew: false, createdAt: '2025-01-08' },
];

export const bannerSlides: BannerSlide[] = [
  {
    id: '1',
    title: 'Express Your Style',
    subtitle: 'Premium phone cases with stunning designs',
    image: heroBanner,
    ctaText: 'Shop Now',
    ctaLink: '/products',
  },
  {
    id: '2',
    title: 'Anime Collection',
    subtitle: 'Your favorite characters on your phone',
    image: animeNaruto,
    ctaText: 'Explore',
    ctaLink: '/category/anime',
  },
  {
    id: '3',
    title: 'New Arrivals',
    subtitle: 'Fresh designs added every week',
    image: marvelIronman,
    ctaText: 'View New',
    ctaLink: '/products',
  },
];

export const mockUsers = [
  { id: '1', email: 'admin@casepix.com', name: 'Admin User', role: 'admin' as const },
  { id: '2', email: 'john@example.com', name: 'John Doe', role: 'user' as const },
  { id: '3', email: 'jane@example.com', name: 'Jane Smith', role: 'user' as const },
];

export const mockOrders = [
  { id: 'ORD001', userId: '2', items: [{ productId: '1', quantity: 1, brandId: '1', modelId: '1' }], status: 'delivered' as const, totalAmount: 499, createdAt: '2025-01-25' },
  { id: 'ORD002', userId: '3', items: [{ productId: '8', quantity: 2, brandId: '2', modelId: '8' }], status: 'processing' as const, totalAmount: 1198, createdAt: '2025-01-28' },
  { id: 'ORD003', userId: '2', items: [{ productId: '5', quantity: 1, brandId: '1', modelId: '3' }], status: 'pending' as const, totalAmount: 449, createdAt: '2025-01-30' },
];
