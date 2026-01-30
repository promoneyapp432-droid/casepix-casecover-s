import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold">CasePix</span>
            </div>
            <p className="text-background/70 text-sm">
              Premium phone cases with stunning designs. Express your style with CasePix.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-background/20 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-background/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-background/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-background/70 hover:text-background transition-colors text-sm">All Products</Link></li>
              <li><Link to="/categories" className="text-background/70 hover:text-background transition-colors text-sm">Categories</Link></li>
              <li><Link to="/new-arrivals" className="text-background/70 hover:text-background transition-colors text-sm">New Arrivals</Link></li>
              <li><Link to="/top-designs" className="text-background/70 hover:text-background transition-colors text-sm">Top Designs</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/faq" className="text-background/70 hover:text-background transition-colors text-sm">FAQ</Link></li>
              <li><Link to="/shipping" className="text-background/70 hover:text-background transition-colors text-sm">Shipping Info</Link></li>
              <li><Link to="/returns" className="text-background/70 hover:text-background transition-colors text-sm">Returns</Link></li>
              <li><Link to="/contact" className="text-background/70 hover:text-background transition-colors text-sm">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-background/70">
                <Mail className="w-4 h-4" />
                support@casepix.com
              </li>
              <li className="flex items-center gap-2 text-sm text-background/70">
                <Phone className="w-4 h-4" />
                +91 9876543210
              </li>
              <li className="flex items-start gap-2 text-sm text-background/70">
                <MapPin className="w-4 h-4 mt-0.5" />
                123 Design Street, Mumbai, India
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-8 pt-8 text-center text-sm text-background/50">
          <p>© 2025 CasePix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
