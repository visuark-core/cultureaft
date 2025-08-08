import React from 'react';
import { Calendar, MapPin, Users, Palette, Crown, Star } from 'lucide-react';

const Heritage = () => {
  const timelineEvents = [
    {
      year: '1459',
      title: 'Foundation of Jodhpur',
      description: 'Rao Jodha establishes the city, laying the foundation for centuries of artistic tradition.',
      icon: Crown,
      image: 'https://images.pexels.com/photos/12833633/pexels-photo-12833633.jpeg?auto=compress&cs=tinysrgb&w=800' // Example Image
    },
    {
      year: '1600s',
      title: 'Royal Patronage',
      description: 'Maharajas begin commissioning elaborate furniture and decor, establishing craft guilds.',
      icon: Star,
      image: 'https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg?auto=compress&cs=tinysrgb&w=800' // Example Image
    },
    {
      year: '1800s',
      title: 'Technique Refinement',
      description: 'Traditional woodworking techniques reach their pinnacle with intricate carving methods.',
      icon: Palette,
      image: 'https://images.pexels.com/photos/1292115/pexels-photo-1292115.jpeg?auto=compress&cs=tinysrgb&w=800' // Example Image
    },
    {
      year: 'Today',
      title: 'Modern Revival',
      description: 'Contemporary artisans blend traditional techniques with modern design sensibilities.',
      icon: Users,
      image: 'https://images.pexels.com/photos/3757955/pexels-photo-3757955.jpeg?auto=compress&cs=tinysrgb&w=800' // Example Image
    }
  ];

  const festivals = [
    {
      name: 'Gangaur Festival',
      description: 'Celebrates marital bliss and influences floral patterns in our designs.',
      month: 'March/April',
      influence: 'Floral Motifs'
    },
    {
      name: 'Teej Festival',
      description: 'Monsoon celebration inspiring green and gold color combinations.',
      month: 'August',
      influence: 'Color Palettes'
    },
    {
      name: 'Diwali',
      description: 'Festival of lights reflected in our lamp and lighting designs.',
      month: 'October/November',
      influence: 'Lighting Designs'
    },
    {
      name: 'Marwar Festival',
      description: 'Regional celebration showcasing local culture and craftsmanship.',
      month: 'October',
      influence: 'Traditional Patterns'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiSGGM4WQBq7KdRSjRCkbOPll2pGf2Ly0tug&s)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-blue-600/60"></div>
        </div>
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Cultural Heritage
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Journey through five centuries of artistic excellence, where royal patronage
                and master craftsmanship have created a legacy that continues to inspire our work today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- New Timeline Section --- */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">A Legacy Forged in Time</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Follow the key milestones that have defined Jodhpur's artistic identity.
            </p>
          </div>

          <div className="relative">
            {/* The vertical line */}
            <div className="absolute left-1/2 -ml-px w-0.5 h-full bg-gradient-to-b from-blue-200 via-orange-200 to-transparent" aria-hidden="true"></div>

            <div className="space-y-12 lg:space-y-24">
              {timelineEvents.map((event, index) => (
                <div key={index} className="relative flex items-center">
                  {/* Icon in the middle */}
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-orange-500 rounded-full">
                       <event.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className={`w-full flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className="w-full lg:w-5/12">
                      <div className={`p-6 rounded-2xl shadow-xl bg-gradient-to-br from-blue-50 to-orange-50 hover:shadow-2xl transition-shadow duration-300 ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>
                        <span className="text-2xl font-bold text-orange-600">{event.year}</span>
                        <h3 className="text-xl font-bold text-blue-900 my-2">{event.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{event.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Festival Influences */}
      <section className="py-16 bg-blue-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">Festival Influences</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              How local celebrations and traditions inspire our designs throughout the year
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {festivals.map((festival, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                <div className="flex items-center mb-4">
                  <Calendar className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">{festival.name}</h3>
                    <span className="text-sm text-orange-600 font-medium">{festival.month}</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 leading-relaxed">{festival.description}</p>

                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-sm font-semibold text-blue-900">Design Influence:</span>
                  <p className="text-sm text-gray-700 mt-1">{festival.influence}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cultural Significance */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">The Soul of Marwar</h2>
              <p className="text-xl text-blue-100 mb-6 leading-relaxed">
                Every piece we create carries the essence of Marwar's rich cultural heritage.
                The geometric patterns reflect the architectural grandeur of Mehrangarh Fort,
                while the vibrant colors echo the bustling bazaars of the old city.
              </p>
              <p className="text-lg text-blue-200 mb-8">
                Our artisans don't just create furniture; they preserve stories, traditions,
                and the timeless spirit of Jodhpur's royal legacy for future generations.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">500+</div>
                  <div className="text-blue-200">Years of Tradition</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">50+</div>
                  <div className="text-blue-200">Master Artisans</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.pexels.com/photos/6956870/pexels-photo-6956870.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Traditional Craftsmanship"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-yellow-400 rounded-full opacity-30 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Heritage;