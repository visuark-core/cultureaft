import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft, Tag } from 'lucide-react';

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

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:3000/api/blogs/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setPost({
          id: data._id,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          category: data.category,
          author: data.author || 'Admin',
          date: data.createdAt,
          readTime: '5 min read',
          image: data.image,
          tags: data.tags || []
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Blog post not found');
        setLoading(false);
      });
  }, [id]);


  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Blog post not found</h1>
          <Link 
            to="/blog"
            className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Hero Section with Image */}
      <div className="relative h-[60vh] max-h-[600px] min-h-[400px]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${post.image})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <Link 
              to="/blog"
              className="inline-flex items-center mb-6 text-blue-200 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Blog
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                {post.author}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(post.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {post.readTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-12">
          {/* Category Tag */}
          <div className="mb-8">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {post.category}
            </span>
          </div>

          {/* Content */}
          <div 
            className="prose prose-blue max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-start flex-wrap gap-2">
              <Tag className="w-5 h-5 text-blue-600 mt-1" />
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

        {/* Author Bio */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{post.author}</h3>
              <p className="text-gray-600 mt-1">Expert Craftsperson & Content Creator</p>
              <p className="text-gray-500 mt-2">
                Passionate about sharing knowledge and insights about traditional craftsmanship
                and sustainable practices in furniture making.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12">
          <Link 
            to="/blog"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to All Posts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
