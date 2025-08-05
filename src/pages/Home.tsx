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

  return (
    <div>
      <Hero />
      
      {/* Stats Section */}
      <section className="py-16 bg-white">
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