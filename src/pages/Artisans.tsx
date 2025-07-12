import React from 'react';
import { Award, MapPin, Clock, Users, Heart, Star } from 'lucide-react';

const Artisans = () => {
  const masterArtisans = [
    {
      id: 1,
      name: 'Master Ravi Sharma',
      specialty: 'Wood Carving & Throne Chairs',
      experience: '25 years',
      location: 'Old City, Jodhpur',
      image: 'https://images.pexels.com/photos/8293778/pexels-photo-8293778.jpeg?auto=compress&cs=tinysrgb&w=600',
      story: 'Born into a family of royal craftsmen, Ravi learned the ancient art of wood carving from his grandfather. His intricate throne chairs are sought after by collectors worldwide.',
      signature: 'Royal Peacock Motifs',
      achievements: ['National Craft Award 2019', 'UNESCO Heritage Artisan', 'Royal Commission Artist'],
      specialization: ['Hand Carving', 'Gold Leaf Work', 'Traditional Joinery']
    },
    {
      id: 2,
      name: 'Master Priya Devi',
      specialty: 'Mirror Work & Decorative Arts',
      experience: '18 years',
      location: 'Mandore, Jodhpur',
      image: 'https://images.pexels.com/photos/5621970/pexels-photo-5621970.jpeg?auto=compress&cs=tinysrgb&w=600',
      story: 'One of the few women master artisans in Jodhpur, Priya has revolutionized traditional mirror work by incorporating contemporary design elements while preserving ancient techniques.',
      signature: 'Geometric Mirror Patterns',
      achievements: ['Women Entrepreneur Award', 'Traditional Arts Fellowship', 'International Design Recognition'],
      specialization: ['Shisha Work', 'Mirror Cutting', 'Pattern Design']
    },
    {
      id: 3,
      name: 'Craftsman Mukesh Joshi',
      specialty: 'Brass Inlay & Cabinet Making',
      experience: '22 years',
      location: 'Salawas Village',
      image: 'https://images.pexels.com/photos/6492400/pexels-photo-6492400.jpeg?auto=compress&cs=tinysrgb&w=600',
      story: 'Mukesh has perfected the delicate art of brass inlay work, creating intricate patterns that transform simple furniture into masterpieces. His work adorns palaces across Rajasthan.',
      signature: 'Intricate Brass Inlays',
      achievements: ['Master Craftsman Certificate', 'Heritage Preservation Award', 'Export Excellence Award'],
      specialization: ['Brass Inlay', 'Traditional Joinery', 'Cabinet Construction']
    },
    {
      id: 4,
      name: 'Artisan Gopal Singh',
      specialty: 'Coffee Tables & Lattice Work',
      experience: '20 years',
      location: 'Jodhpur City',
      image: 'https://images.pexels.com/photos/9648555/pexels-photo-9648555.jpeg?auto=compress&cs=tinysrgb&w=600',
      story: 'Gopal specializes in creating stunning coffee tables with intricate lattice work. His innovative designs blend traditional Rajasthani patterns with modern functionality.',
      signature: 'Geometric Lattice Patterns',
      achievements: ['Design Innovation Award', 'Traditional Arts Master', 'Craft Excellence Recognition'],
      specialization: ['Lattice Work', 'Table Construction', 'Pattern Innovation']
    }
  ];

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
      description: 'Choosing the finest timber, often aged for decades for optimal quality.',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/5621970/pexels-photo-5621970.jpeg?auto=compress&cs=tinysrgb&w=1600)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-orange-600/60"></div>
        </div>
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Master Artisans
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Meet the skilled craftspeople who breathe life into wood, creating furniture 
                that carries the soul of Jodhpur's rich artistic heritage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Artisans */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">Our Master Craftspeople</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each artisan brings decades of experience and a unique perspective to their craft
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {masterArtisans.map((artisan) => (
              <div key={artisan.id} className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <img
                      src={artisan.image}
                      alt={artisan.name}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  </div>
                  
                  <div className="md:w-2/3 p-8">
                    <div className="flex items-center mb-4">
                      <div className="flex items-center text-orange-500 mr-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-blue-600">Master Artisan</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-blue-900 mb-2">{artisan.name}</h3>
                    <p className="text-lg text-orange-600 font-semibold mb-4">{artisan.specialty}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {artisan.experience}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {artisan.location}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">{artisan.story}</p>
                    
                    <div className="mb-4">
                      <span className="text-sm font-semibold text-blue-900">Signature Style:</span>
                      <span className="text-sm text-gray-600 ml-2">{artisan.signature}</span>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-sm font-semibold text-blue-900 block mb-2">Specializations:</span>
                      <div className="flex flex-wrap gap-2">
                        {artisan.specialization.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-semibold text-blue-900 block mb-2">Achievements:</span>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {artisan.achievements.map((achievement, index) => (
                          <li key={index} className="flex items-center">
                            <Award className="h-3 w-3 text-orange-500 mr-2" />
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                  
                  <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300">
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
              <button className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors duration-300">
                Schedule Visit
              </button>
              <button className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-white/30 transition-colors duration-300 border border-white/30">
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