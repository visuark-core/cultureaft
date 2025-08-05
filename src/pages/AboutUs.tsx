import React from 'react';
import { MapPin, Clock, Users } from 'lucide-react';

const Artisans = () => {
  const workshops = [
    {
      title: 'Traditional Wood Carving',
      description: 'Learn the ancient techniques of hand carving with traditional tools.',
      duration: '3 hours',
      level: 'Beginner to Advanced',
      image: 'https://images.pexels.com/photos/5621970/pexels-photo-5621970.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      title: 'Mirror Work Mastery',
      description: 'Discover the art of creating beautiful mirror mosaics and patterns.',
      duration: '2 hours',
      level: 'All Levels',
      image: 'https://images.pexels.com/photos/6580226/pexels-photo-6580226.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      title: 'Brass Inlay Techniques',
      description: 'Master the delicate art of embedding brass patterns into wood.',
      duration: '4 hours',
      level: 'Intermediate',
      image: 'https://images.pexels.com/photos/8293778/pexels-photo-8293778.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const craftingProcess = [
    {
      step: 1,
      title: 'Design & Planning',
      description: 'Every piece begins with careful planning and traditional pattern selection.',
      icon: '🎨'
    },
    {
      step: 2,
      title: 'Wood Selection',
      description: 'Choosing the finest timber, often aged for decades for optimal quality. For example :- Mango, Teak, Sheesham etc and other local woods.According to customers need and budget',
      icon: '🌳'
    },
    {
      step: 3,
      title: 'Hand Carving',
      description: 'Skilled artisans hand-carve intricate patterns using traditional tools.',
      icon: '🔨'
    },
    {
      step: 4,
      title: 'Detail Work',
      description: 'Adding brass inlays, mirror work, and other decorative elements.',
      icon: '✨'
    },
    {
      step: 5,
      title: 'Finishing',
      description: 'Multiple layers of natural finishes to enhance beauty and durability.',
      icon: '🎯'
    },
    {
      step: 6,
      title: 'Quality Check',
      description: 'Rigorous inspection ensures every piece meets our high standards.',
      icon: '✅'
    }
  ];
  
  const handleButtonClick = (action: string) => {
    console.log(`${action} button clicked!`);
    // Placeholder for future functionality, e.g., opening a modal
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/6956870/pexels-photo-6956870.jpeg?auto=compress&cs=tinysrgb&w=1600)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-orange-600/60"></div>
        </div>
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                About Us
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                We are purveyors of heritage, dedicated to preserving the timeless craft of
                Jodhpur. Our mission is to bring the soul of Rajasthani art into homes 
                around the world. Join with us to save the heritage and support the artisans who pour their heart and soul into every piece.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Crafting Process */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">The Crafting Journey</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From concept to completion, follow the meticulous process our artisans use to create each masterpiece
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {craftingProcess.map((process) => (
              <div key={process.step} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
                <div className="text-6xl mb-4">{process.icon}</div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 mx-auto">
                  {process.step}
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">{process.title}</h3>
                <p className="text-gray-600 leading-relaxed">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop Experience */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">Learn from the Masters</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience hands-on workshops with our master artisans and learn traditional techniques
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {workshops.map((workshop, index) => (
              <div key={index} className="bg-gradient-to-br from-orange-50 to-blue-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <img
                  src={workshop.image}
                  alt={workshop.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-3">{workshop.title}</h3>
                  <p className="text-gray-600 mb-4">{workshop.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-orange-500" />
                      Duration: {workshop.duration}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-orange-500" />
                      Level: {workshop.level}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleButtonClick('Book Workshop')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300">
                    Book Workshop
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white">
            <h3 className="text-3xl font-bold mb-4">Visit Our Workshop</h3>
            <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
              Experience the magic of traditional craftsmanship firsthand. Watch our artisans at work 
              and learn about the techniques passed down through generations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => handleButtonClick('Schedule Visit')}
                className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors duration-300">
                Schedule Visit
              </button>
              <button 
                onClick={() => handleButtonClick('Virtual Tour')}
                className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-white/30 transition-colors duration-300 border border-white/30">
                Virtual Tour
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Artisans;