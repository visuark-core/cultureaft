import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Exquisite Carved Furniture",
      subtitle: "Timeless Elegance from the Blue City",
      description: "Discover handcrafted wooden furniture that brings the royal heritage of Jodhpur into your home.",
      image: "https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=1600",
      cta: "Explore Furniture"
    },
    {
      id: 2,
      title: "Decorative Masterpieces",
      subtitle: "Art That Tells Stories",
      description: "From ornate mirrors to intricate wall art, each piece celebrates centuries of Rajasthani craftsmanship.",
      image: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1600",
      cta: "View Decor"
    },
    {
      id: 3,
      title: "Master Artisan Creations",
      subtitle: "Preserving Ancient Traditions",
      description: "Meet the skilled artisans who breathe life into wood, creating furniture that lasts generations.",
      image: "https://images.pexels.com/photos/5621970/pexels-photo-5621970.jpeg?auto=compress&cs=tinysrgb&w=1600",
      cta: "Meet Artisans"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-orange-900/20 z-10"></div>
      
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
            index === currentSlide ? 'translate-x-0' : 
            index < currentSlide ? '-translate-x-full' : 'translate-x-full'
          }`}
        >
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-transparent"></div>
          </div>
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 flex items-center h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="transform transition-all duration-1000 ease-out">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
                {slides[currentSlide].title}
              </h1>
              <h2 className="text-xl md:text-2xl text-orange-300 font-semibold mb-6">
                {slides[currentSlide].subtitle}
              </h2>
              <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
                {slides[currentSlide].description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-full hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 shadow-lg">
                  {slides[currentSlide].cta}
                </button>
                <button className="inline-flex items-center px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-white/30 transition-all duration-300 border border-white/30">
                  <Play className="mr-2 h-5 w-5" />
                  Virtual Tour
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-300"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-300"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-orange-500 w-8' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-32 h-32 border-4 border-orange-400/30 rounded-full animate-pulse hidden lg:block"></div>
      <div className="absolute bottom-32 left-20 w-20 h-20 border-4 border-blue-400/30 rounded-full animate-pulse hidden lg:block"></div>
    </div>
  );
};

export default Hero;