import React, { useState } from 'react';
// import AdminHeader from './AdminHeader';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'quill/dist/quill.snow.css';
// Quill toolbar options for advanced features (no image resize)
const quillModules = {
  toolbar: [
    [{ 'font': [] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],
    ['clean']
  ]
};

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

const BlogManagement = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Craftsmanship',
    image: '',
    tags: '',
  });
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  // Fetch blogs from backend
  React.useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:3000/api/blogs');
        const data = await res.json();
        setBlogPosts(data.map((b: any) => ({
          id: String(b._id),
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
      } catch (err) {
        setError('Failed to fetch blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()),
        author: 'Admin',
      };
      let res, resultBlog;
      if (editId) {
        // Update existing blog
        res = await fetch(`http://localhost:3000/api/blogs/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update blog');
        resultBlog = await res.json();
        setBlogPosts(prev => prev.map(post =>
          post.id === editId
            ? {
                ...post,
                ...resultBlog,
                id: String(resultBlog._id),
                tags: resultBlog.tags || [],
                author: resultBlog.author || 'Admin',
                date: resultBlog.createdAt,
              }
            : post
        ));
      } else {
        // Create new blog
        res = await fetch('http://localhost:3000/api/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to add blog');
        resultBlog = await res.json();
        setBlogPosts(prev => [
          {
            id: String(resultBlog._id),
            title: resultBlog.title,
            excerpt: resultBlog.excerpt,
            content: resultBlog.content,
            category: resultBlog.category,
            author: resultBlog.author || 'Admin',
            date: resultBlog.createdAt,
            readTime: '5 min read',
            image: resultBlog.image,
            tags: resultBlog.tags || []
          },
          ...prev
        ]);
      }
      setShowCreateForm(false);
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        category: 'Craftsmanship',
        image: '',
        tags: '',
      });
      setEditId(null);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:3000/api/blogs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
  setBlogPosts(posts => posts.filter(post => String(post.id) !== String(id)));
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
  {/* <AdminHeader /> */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
            <p className="text-gray-600">Create and manage your blog posts</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Post
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search posts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Categories</option>
              <option value="Craftsmanship">Craftsmanship</option>
              <option value="Sustainability">Sustainability</option>
              <option value="Design">Design</option>
            </select>
          </div>
        </div>

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-6">Create New Blog Post</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Craftsmanship">Craftsmanship</option>
                    <option value="Sustainability">Sustainability</option>
                    <option value="Design">Design</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="furniture, design, traditional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <div className="border rounded-lg">
                    <ReactQuill
                      theme="snow"
                      value={formData.content}
                      onChange={handleContentChange}
                      className="h-64 mb-12"
                      modules={quillModules}
                      placeholder="Write your blog content here..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Publish Post
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Blog Posts List */}
        <div className="bg-white rounded-xl shadow mt-8">
          {loading && <div className="p-4 text-blue-700">Loading...</div>}
          {error && <div className="p-4 text-red-600">{error}</div>}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {blogPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="h-10 w-10 rounded-lg object-cover mr-3"
                        />
                        <div className="truncate max-w-md">
                          <div className="font-medium text-gray-900">{post.title}</div>
                          <div className="text-sm text-gray-500 truncate">{post.excerpt}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(post.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {post.author}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditId(post.id);
                          setFormData({
                            title: post.title,
                            excerpt: post.excerpt,
                            content: post.content,
                            category: post.category,
                            image: post.image,
                            tags: post.tags.join(', '),
                          });
                          setShowCreateForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(String(post.id))}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogManagement;
