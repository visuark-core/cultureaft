import React from 'react';
import { Clock, Users } from 'lucide-react';

// Animation and graphics helpers
const fadeIn = 'animate-fade-in';
const slideUp = 'animate-slide-up';
const pulse = 'animate-pulse-slow';
const blob = 'absolute rounded-full opacity-30 blur-2xl pointer-events-none';

const About = () => {
  // Partners photo section data
  const partnersPhoto = {
    image: 'https://img.freepik.com/premium-photo/portrait-bankers-suits-talking-financiers-go-work-together-lawyers-communicate-with-each-other-entrepreneurs-work-near-office_283470-7245.jpg',
    alt: 'Founders of CultureAft',
    names: ['Nandkishor', 'Mahaveer Singh'],
    description: 'Meet our founders, Neeraj and Aarti, whose shared vision and passion for heritage crafts led to the creation of CultureAft.'
  };

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
    <div className="relative min-h-screen bg-gradient-to-br from-blue-100 via-orange-50 to-pink-100 overflow-x-hidden">
      {/* Decorative animated blobs */}
      <div className="hidden md:block">
        <div className={blob + ' w-96 h-96 bg-blue-300 top-[-6rem] left-[-6rem] ' + pulse} style={{zIndex:0}} />
        <div className={blob + ' w-80 h-80 bg-orange-200 top-[40vh] right-[-8rem] ' + pulse} style={{zIndex:0}} />
        <div className={blob + ' w-72 h-72 bg-pink-200 bottom-[-6rem] left-[40vw] ' + pulse} style={{zIndex:0}} />
      </div>
      {/* About Us Partners Section */}
      <section className="py-16 bg-white">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12 rounded-3xl shadow-2xl bg-gradient-to-br from-white/90 to-blue-50/80 border border-blue-100 overflow-hidden" style={{zIndex:1}}>
          {/* Animated SVG graphic */}
          <div className="md:w-1/2 flex justify-center items-center relative">
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full blur-2xl opacity-40 animate-pulse-slow" />
            <div className="w-[340px] h-[255px] sm:w-[400px] sm:h-[300px] md:w-[480px] md:h-[360px] flex items-center justify-center overflow-hidden rounded-3xl border-4 border-blue-200 shadow-xl bg-white" style={{zIndex:2}}>
              <img
                src={partnersPhoto.image}
                alt={partnersPhoto.alt}
                className={"object-cover w-full h-full transition-transform duration-500 hover:scale-105 " + fadeIn}
                style={{objectFit:'cover'}}
              />
            </div>
            <svg className="absolute bottom-0 right-0 w-24 h-24 opacity-30 animate-spin-slow" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#fbbf24" strokeWidth="8" fill="none" strokeDasharray="12 8" />
            </svg>
          </div>
          <div className={"md:w-1/2 text-center md:text-left space-y-4 " + slideUp}>
            <h2 className="text-4xl font-extrabold text-blue-900 mb-2 tracking-tight drop-shadow-lg">About Us</h2>
            <p className="text-lg text-gray-700 mb-4 font-medium leading-relaxed drop-shadow-sm">{partnersPhoto.description}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              {partnersPhoto.names.map((name, idx) => (
                <span key={idx} className="inline-block bg-gradient-to-r from-blue-200 to-orange-100 text-blue-900 px-5 py-2 rounded-full font-bold text-base shadow-md border border-blue-200 animate-bounce-slow">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Story & Crafting Process */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className={"text-center mb-16 " + fadeIn}>
            <h2 className="text-4xl font-extrabold text-orange-600 mb-4 tracking-tight drop-shadow-lg animate-bounce-slow">Our Story</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-sm animate-fade-in">
              Our journey began in the vibrant streets of Jodhpur, where the colors of Rajasthan ignite the imagination and every alleyway hums with the rhythm of artisans at work. Inspired by the magic of ancient forts, bustling bazaars, and the timeless artistry passed down through generations, we set out on a mission to celebrate and preserve this living heritage.<br/><br/>
              <span className="bg-gradient-to-r from-orange-200 to-pink-100 px-2 py-1 rounded-lg font-semibold">CultureAft is more than a brand—it's an adventure!</span> We travel deep into villages, discover hidden workshops, and connect with master craftspeople whose hands shape dreams from wood, brass, and mirror. Every piece we share carries a story of passion, resilience, and the thrill of creation. <br/><br/>
              <span className="text-blue-700 font-bold">Join us</span> as we bridge tradition and innovation, empower local talent, and invite the world to experience the wonder of Rajasthan's artistic soul. <span className="underline decoration-wavy decoration-orange-400">The adventure is just beginning—be a part of our story!</span>
            </p>
          </div>
          <div className={"text-center mb-16 " + slideUp}>
            <h2 className="text-3xl font-bold text-blue-900 mb-4 animate-bounce-slow">The Crafting Journey</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed animate-fade-in">
              From concept to completion, follow the meticulous process our artisans use to create each masterpiece:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {craftingProcess.map((process) => (
              <div key={process.step} className={"bg-white rounded-3xl p-8 shadow-2xl hover:shadow-orange-200 transition-shadow duration-300 text-center border-t-4 border-orange-200 relative overflow-hidden " + fadeIn}>
                <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-blue-200 to-orange-100 rounded-full blur-2xl opacity-30 animate-pulse-slow" />
                <div className="text-6xl mb-4 animate-bounce-slow drop-shadow-lg">{process.icon}</div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 mx-auto shadow-md animate-fade-in">
                  {process.step}
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-3 drop-shadow-sm">{process.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium animate-fade-in">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop Experience */}
      <section className="py-16 bg-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className={"text-center mb-16 " + fadeIn}>
            <h2 className="text-4xl font-extrabold text-blue-900 mb-4 tracking-tight drop-shadow-lg animate-bounce-slow">Workshops & Experiences</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium leading-relaxed animate-fade-in">
              Join our hands-on workshops to learn traditional techniques and experience the joy of creating art with your own hands.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {workshops.map((workshop, index) => (
              <div key={index} className={"bg-gradient-to-br from-orange-50 to-blue-50 rounded-3xl overflow-hidden shadow-xl hover:shadow-orange-200 transition-shadow duration-300 border-t-4 border-blue-200 relative " + slideUp}>
                <div className="absolute -top-8 -left-8 w-20 h-20 bg-gradient-to-br from-pink-200 to-orange-100 rounded-full blur-2xl opacity-30 animate-pulse-slow" />
                <img
                  src={workshop.image}
                  alt={workshop.title}
                  className="w-full h-48 object-cover rounded-t-2xl animate-fade-in"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-3 drop-shadow-sm">{workshop.title}</h3>
                  <p className="text-gray-600 mb-4 font-medium animate-fade-in">{workshop.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-orange-500 animate-pulse-slow" />
                      <span className="font-semibold">Duration:</span> {workshop.duration}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-orange-500 animate-pulse-slow" />
                      <span className="font-semibold">Level:</span> {workshop.level}
                    </div>
                  </div>
                  <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-bold shadow-md animate-bounce-slow">
                    Book Workshop
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Call to Action */}
          <div className={"text-center bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl " + fadeIn}>
            <h3 className="text-3xl font-extrabold mb-4 animate-bounce-slow">Visit Us</h3>
            <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto font-medium animate-fade-in">
              Experience the magic of traditional craftsmanship firsthand. Watch our artisans at work and learn about the techniques passed down through generations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors duration-300 shadow-md animate-bounce-slow">
                Schedule Visit
              </button>
              <button className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-white/30 transition-colors duration-300 border border-white/30 shadow-md animate-bounce-slow">
                Virtual Tour
              </button>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
};

export default About;
