import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Users, Award, Palette } from 'lucide-react';
import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';
import CulturalShowcase from '../components/CulturalShowcase';

const Home = () => {
  const stats = [
    { icon: Star, value: '100+', label: 'Handcrafted Products' },
    { icon: Users, value: '5+', label: 'Master Artisans' },
    { icon: Award, value: '200+', label: 'Years of Tradition' },
    { icon: Palette, value: '8+', label: 'Art Forms' }
  ];

  // Category card data (example)
  const categories = [
    {
      name: 'Beds',
      image: 'https://images.urbanladder.com/products/bed.jpg',
      link: '/products/beds',
    },
    {
      name: 'Dining Tables',
      image: 'https://images.urbanladder.com/products/dining-table.jpg',
      link: '/products/dining-tables',
    },
    {
      name: 'Office Desks',
      image: 'https://images.urbanladder.com/products/office-desk.jpg',
      link: '/products/office-desks',
    },
    {
      name: 'Chairs',
      image: 'https://images.urbanladder.com/products/chair.jpg',
      link: '/products/chairs',
    },
  ];

  // Scroll logic
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div>
      <Hero />

  {/* Stats Section */}
  <section className="py-16 bg-gradient-to-r from-blue-50 via-teal-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Categories Section - with color accents */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 items-center">
          {/* Left panel */}
          <div className="w-full md:w-1/4 mb-8 md:mb-0 flex flex-col items-start justify-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Shop<br />by Categories</h2>
            <div className="w-16 h-1 bg-teal-500 rounded mb-6"></div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                <span role="img" aria-label="sofa" className="text-2xl">🛋️</span>
              </span>
              <div>
                <div className="text-lg font-semibold text-gray-900">1000+</div>
                <div className="text-gray-600 text-sm">Unique Products</div>
              </div>
            </div>
            <Link to="/products" className="text-gray-900 font-semibold text-base border-b-2 border-teal-500 inline-flex items-center gap-2 hover:text-teal-600 transition-colors">
              All Categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Scrollable categories row */}
          <div className="relative w-full md:w-3/4">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-teal-500 rounded-full shadow p-2 hover:bg-teal-50"
              aria-label="Scroll left"
            >
              <ArrowRight className="w-6 h-6 rotate-180 text-teal-600" />
            </button>
            <div
              ref={scrollRef}
              className="flex gap-8 px-8"
              style={{ scrollBehavior: 'smooth', overflowX: 'hidden' }}
            >
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  to={cat.link}
                  className="min-w-[220px] max-w-[240px] bg-gray-50 rounded-2xl flex flex-col items-center py-8 px-4 shadow hover:shadow-lg transition-shadow duration-300 hover:border-2 hover:border-teal-500"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-32 h-32 object-contain mb-4"
                  />
                  <div className="text-lg font-semibold text-gray-900 mb-2">{cat.name}</div>
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-teal-500 rounded-full shadow p-2 hover:bg-teal-50"
              aria-label="Scroll right"
            >
              <ArrowRight className="w-6 h-6 text-teal-600" />
            </button>
          </div>
        </div>
      </section>

      <FeaturedProducts />
      <CulturalShowcase />

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Discover the Art of Jodhpur
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Each piece tells a story of centuries-old craftsmanship, passed down through generations 
            of master artisans in the Blue City of Jodhpur.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center px-8 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors duration-300 group"
            >
              Explore Collection
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              to="/heritage"
              className="inline-flex items-center px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-blue-600 transition-colors duration-300"
            >
              Learn Our Heritage
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;