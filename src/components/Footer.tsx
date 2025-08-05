import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  const quickLinks = [
    { name: 'Furniture Collection', path: '/products/furniture' },
    { name: 'Decor Items', path: '/products/decor' },
    { name: 'Cultural Heritage', path: '/heritage' },
    { name: 'About Us', path: '/artisans' },
  ];

  const categories = [
    { name: 'Carved Chairs', path: '/products/furniture' },
    { name: 'Wooden Tables', path: '/products/furniture' },
    { name: 'Storage Cabinets', path: '/products/furniture' },
    { name: 'Decorative Mirrors', path: '/products/decor' },
    { name: 'Wall Art', path: '/products/decor' },
    { name: 'Accessories', path: '/products/decor' },
  ];

  return (
    <footer className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Crown className="h-8 w-8 text-orange-400" />
              <div>
                <h3 className="text-xl font-bold">Cultureft</h3>
                <p className="text-sm text-blue-200">Heritage Furniture & Decor</p>
              </div>
            </div>
            <p className="text-blue-200 mb-4">
              Celebrating the timeless art and cultural heritage of Jodhpur through 
              exquisite handcrafted furniture and decorative pieces.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-orange-400">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-blue-200 hover:text-white transition-colors duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-orange-400">Categories</h4>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.name}>
                  <Link to={category.path} className="text-blue-200 hover:text-white transition-colors duration-300">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-orange-400">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-orange-400 mt-1" />
                <div>
                  <p className="text-blue-200">Heritage Workshop</p>
                  <p className="text-blue-200">Old City, Jodhpur, Rajasthan</p>
                  <p className="text-blue-200">India - 342001</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-orange-400" />
                <p className="text-blue-200">+91 291 XXX XXXX</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-orange-400" />
                <p className="text-blue-200">info@jodhpurcrafts.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-700 mt-8 pt-8 text-center">
          <p className="text-blue-200">
            © 2024 Cultureaft. All rights reserved. | Preserving tradition, Creating tomorrow.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;