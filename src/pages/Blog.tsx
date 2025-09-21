import { Calendar, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';


import React, { useEffect, useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  tags: string[];
}

const Blog = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:3000/api/blogs')
      .then(res => res.json())
      .then(data => {
        setBlogPosts(data.map((b: any) => ({
          id: b._id,
          title: b.title,
          excerpt: b.excerpt,
          content: b.content,
          category: b.category,
          author: b.author || 'Admin',
          date: b.createdAt,
          readTime: '5 min read',
          image: b.image,
          tags: b.tags || []
        })));
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load blogs');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Hero Section */}
      <section className="relative py-20 bg-blue-900 text-white">
        <div className="absolute inset-0 bg-blue-900 opacity-90"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our Craft Stories
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Discover the stories behind our craftsmanship, sustainability initiatives,
              and the artisans who bring our furniture to life.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Categories and Search (can be implemented later) */}
          <div className="flex flex-wrap gap-4 mb-12">
            <button className="px-6 py-2 rounded-full bg-blue-900 text-white hover:bg-blue-800 transition">
              All Posts
            </button>
            <button className="px-6 py-2 rounded-full bg-white text-blue-900 hover:bg-blue-50 transition">
              Craftsmanship
            </button>
            <button className="px-6 py-2 rounded-full bg-white text-blue-900 hover:bg-blue-50 transition">
              Sustainability
            </button>
            <button className="px-6 py-2 rounded-full bg-white text-blue-900 hover:bg-blue-50 transition">
              Design
            </button>
          </div>

          {/* Blog Posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group"
              >
                <div className="h-full flex flex-col">
                  <Link to={`/blog/${post.id}`} className="block flex-grow">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-4 py-1 rounded-full text-sm font-medium bg-blue-900 text-white">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-blue-900 mb-3 group-hover:text-blue-700 transition">
                        {post.title}
                      </h2>
                      <p className="text-gray-600 mb-4">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                  
                  <div className="px-6 pb-6">
                    <div className="flex items-center text-sm text-gray-500 gap-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {post.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(post.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {post.readTime}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition">
              Load More Posts
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-blue-100 mb-8">
              Stay updated with our latest articles about craftsmanship,
              sustainability, and furniture design.
            </p>
            <form className="flex gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
