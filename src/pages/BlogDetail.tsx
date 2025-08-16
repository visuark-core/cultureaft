import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft, Tag } from 'lucide-react';

// This type should match your blog post structure
export interface BlogPost {
  id: number;
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

// Sample detailed blog posts data (move this to a separate data file in production)
const blogPostsDetails: BlogPost[] = [
  {
    id: 1,
    title: "Traditional Indian Furniture Making Techniques",
    excerpt: "Discover the ancient techniques of Indian furniture craftsmanship that have been passed down through generations...",
    content: `
      <h2>The Legacy of Indian Craftsmanship</h2>
      <p>For centuries, Indian furniture makers have preserved and perfected their craft, passing down intricate techniques from generation to generation. These artisans, known for their meticulous attention to detail and deep understanding of wood properties, have created pieces that stand the test of time both in durability and design.</p>

      <h3>Ancient Techniques Still Used Today</h3>
      <p>Many of the traditional techniques used in Indian furniture making remain relevant and valuable today. These include:</p>
      <ul>
        <li>Hand-carved joinery that requires no nails or screws</li>
        <li>Natural wood treatment methods using organic oils and waxes</li>
        <li>Intricate inlay work with precious and semi-precious materials</li>
        <li>Traditional wood seasoning techniques that enhance durability</li>
      </ul>

      <h3>The Role of Traditional Tools</h3>
      <p>While modern tools have their place, many master craftsmen still prefer traditional hand tools for certain aspects of furniture making. These tools, often handed down through generations, allow for greater control and precision in detailed work.</p>

      <h2>Preserving Cultural Heritage</h2>
      <p>In today's fast-paced world of mass production, these traditional techniques represent more than just furniture-making methods – they're a vital link to our cultural heritage. By maintaining these practices, we ensure that future generations can appreciate and learn from this rich tradition of craftsmanship.</p>

      <h3>Modern Applications</h3>
      <p>While we honor traditional techniques, we also recognize the need to adapt to contemporary needs. Our artisans skillfully blend ancient methods with modern design sensibilities, creating pieces that are both timeless and relevant to today's homes.</p>
    `,
    category: "Craftsmanship",
    author: "Rajesh Kumar",
    date: "2025-08-10",
    readTime: "5 min read",
    image: "https://images.pexels.com/photos/6707628/pexels-photo-6707628.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tags: ["traditional", "craftsmanship", "furniture"]
  },
  {
    id: 2,
    title: "Sustainable Wood Sourcing in Modern Furniture",
    excerpt: "How we're maintaining the balance between traditional craftsmanship and environmental responsibility...",
    content: `
      <h2>Sustainable Practices in Furniture Making</h2>
      <p>In today's world, responsible wood sourcing is not just an option – it's a necessity. Our commitment to sustainability goes beyond mere compliance with environmental regulations; it's about ensuring that future generations can continue to enjoy both the beauty of wooden furniture and the forests they come from.</p>

      <h3>Our Sourcing Principles</h3>
      <p>We follow strict guidelines in our wood sourcing process:</p>
      <ul>
        <li>Partnership with certified sustainable forests</li>
        <li>Use of reclaimed wood when possible</li>
        <li>Local sourcing to reduce transportation impact</li>
        <li>Regular audits of our supply chain</li>
      </ul>

      <h2>Innovation in Sustainability</h2>
      <p>We're constantly exploring new ways to make our furniture production more sustainable. This includes:</p>
      <ul>
        <li>Advanced wood treatment methods that extend furniture life</li>
        <li>Zero-waste manufacturing processes</li>
        <li>Use of solar power in our workshops</li>
        <li>Water-based, eco-friendly finishes</li>
      </ul>

      <h3>The Impact of Conscious Choices</h3>
      <p>Every piece of sustainably sourced furniture represents a step toward a more environmentally conscious future. By choosing sustainable furniture, customers become part of this important journey.</p>

      <h2>Looking to the Future</h2>
      <p>Our commitment to sustainability is an ongoing journey. We continue to research and implement new methods and technologies that can help us reduce our environmental impact while maintaining the high quality of our furniture.</p>
    `,
    category: "Sustainability",
    author: "Priya Singh",
    date: "2025-08-08",
    readTime: "4 min read",
    image: "https://images.pexels.com/photos/5089175/pexels-photo-5089175.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tags: ["sustainability", "eco-friendly", "wood"]
  }
  // Add more detailed blog posts as needed
];

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const post = blogPostsDetails.find(post => post.id === Number(id));

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
