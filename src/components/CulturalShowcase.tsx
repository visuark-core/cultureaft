import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Palette, Award } from 'lucide-react';

const CulturalShowcase = () => {
  const highlights = [
    {
      icon: Palette,
      title: 'Traditional Craftsmanship',
      description: 'Centuries-old techniques passed down through generations of master artisans.',
      image: 'https://images.pexels.com/photos/5621970/pexels-photo-5621970.jpeg?auto=compress&cs=tinysrgb&w=600',
      link: '/heritage'
    },
    {
      icon: Users,
      title: 'About Us',
      description: 'Meet the skilled craftspeople who bring these masterpieces to life.',
      image: 'https://images.pexels.com/photos/8293778/pexels-photo-8293778.jpeg?auto=compress&cs=tinysrgb&w=600',
      link: '/about'
    },
    {
      icon: Calendar,
      title: 'Festival Influences',
      description: 'How local celebrations and traditions inspire our designs.',
      image: 'https://images.pexels.com/photos/9648555/pexels-photo-9648555.jpeg?auto=compress&cs=tinysrgb&w=600',
      link: '/heritage'
    },
    {
      icon: Award,
      title: 'Cultural Significance',
      description: 'The deep meaning and symbolism behind each handcrafted piece.',
      image: 'https://images.pexels.com/photos/6956870/pexels-photo-6956870.jpeg?auto=compress&cs=tinysrgb&w=600',
      link: '/heritage'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-blue-900 mb-4">Cultural Heritage</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore the rich tapestry of Jodhpur's artistic traditions that inspire every piece in our collection.
          </p>
        </div>

        {/* Main Feature */}
        <div className="mb-16 relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center p-8 lg:p-12">
            <div>
              <h3 className="text-3xl lg:text-4xl font-bold mb-6">The Blue City Legacy</h3>
              <p className="text-lg lg:text-xl text-blue-100 mb-6 leading-relaxed">
                For over 500 years, the artisans of Jodhpur have been creating furniture and decorative 
                pieces that reflect the grandeur of Rajputana royalty. Our craftspeople continue this 
                tradition, blending time-honored techniques with contemporary needs.
              </p>
              <p className="text-blue-200 mb-8">
                Each piece tells a story of cultural pride, artistic excellence, and the enduring 
                spirit of Marwar's greatest city.
              </p>
              <Link
                to="/heritage"
                className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors duration-300"
              >
                Discover Our Story
              </Link>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Jodhpur Blue City"
                className="rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-yellow-400 rounded-full opacity-30 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {highlights.map((highlight, index) => (
            <Link
              key={index}
              to={highlight.link}
              className="group block bg-gradient-to-br from-blue-50 to-orange-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2"
            >
              <div className="relative overflow-hidden rounded-xl mb-6">
                <img
                  src={highlight.image}
                  alt={highlight.title}
                  className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
                <div className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-sm rounded-full">
                  <highlight.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              
              <h4 className="text-xl font-bold text-blue-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">
                {highlight.title}
              </h4>
              
              <p className="text-gray-600 leading-relaxed">
                {highlight.description}
              </p>

              <div className="mt-4 flex items-center text-blue-600 group-hover:text-orange-500 transition-colors duration-300">
                <span className="text-sm font-semibold">Learn More</span>
                <div className="ml-2 w-0 group-hover:w-4 h-0.5 bg-current transition-all duration-300"></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Virtual Tour CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-orange-100 to-blue-100 rounded-3xl p-8 lg:p-12">
          <h3 className="text-3xl font-bold text-blue-900 mb-4">Experience Our Workshop</h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Take a virtual tour of our heritage workshop and witness the magic of traditional 
            craftsmanship in action.
          </p>
          <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-full hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300 shadow-lg">
            <Palette className="mr-2 h-5 w-5" />
            Start Virtual Tour
          </button>
        </div>
      </div>
    </section>
  );
};

export default CulturalShowcase;