

const inputClass = "input bg-white border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 transition w-full placeholder-gray-400";
const sectionClass = "bg-white/80 rounded-2xl shadow p-6 mb-6 border border-pink-100";
const sectionHeaderClass = "flex items-center gap-2 text-xl font-bold mb-4 text-pink-800";

const CategoriesFormFields = () => (
  <form className="space-y-8 w-full max-w-5xl mx-auto px-2 sm:px-4">
    {/* 1️⃣ Basic Category Details */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>1️⃣</span> Basic Category Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="categoryId" placeholder="Category ID (unique)" />
        <input className={inputClass} name="categoryName" placeholder="Category Name" />
        <input className={inputClass} name="parentCategory" placeholder="Parent Category (for subcategory)" />
        <input className={inputClass} name="categorySlug" placeholder="Category Slug (URL-friendly)" />
        <textarea className={inputClass} name="description" placeholder="Description (short overview)" rows={2} />
        <input className={inputClass} name="categoryImage" placeholder="Category Image / Icon" type="file" />
      </div>
    </section>

    {/* 2️⃣ Category Hierarchy */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>2️⃣</span> Category Hierarchy</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <textarea className={inputClass} name="categoryTree" placeholder="Category Tree View (parent-child relationships, nested)" rows={2} />
      </div>
    </section>

    {/* 3️⃣ SEO & Metadata */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>3️⃣</span> SEO & Metadata</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="metaTitle" placeholder="Meta Title (SEO)" />
        <input className={inputClass} name="metaDescription" placeholder="Meta Description" />
        <input className={inputClass} name="categoryKeywords" placeholder="Category Keywords / Tags" />
      </div>
    </section>

    {/* 4️⃣ Display Settings */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>4️⃣</span> Display Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <select className={inputClass} name="visibility" defaultValue="">
          <option value="" disabled>Visibility</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input className={inputClass} name="displayOrder" placeholder="Display Order / Priority" type="number" />
        <input className={inputClass} name="featuredCategory" placeholder="Featured Category (show on homepage)" />
        <input className={inputClass} name="bannerImage" placeholder="Banner Image (for landing page)" type="file" />
      </div>
    </section>

    {/* 5️⃣ Product Association */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>5️⃣</span> Product Association</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="productCount" placeholder="Number of Products in Category" type="number" />
        <input className={inputClass} name="defaultAttributes" placeholder="Default Attributes for Products (size, color, etc.)" />
        <input className={inputClass} name="defaultFilters" placeholder="Default Filters (price range, brand, material)" />
      </div>
    </section>

    {/* 6️⃣ Category Management Actions */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>6️⃣</span> Category Management Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="addCategory" placeholder="Add New Category" />
        <input className={inputClass} name="editCategory" placeholder="Edit Category" />
        <input className={inputClass} name="deleteCategory" placeholder="Delete Category (with reassignment)" />
        <input className={inputClass} name="bulkUpload" placeholder="Bulk Category Upload (CSV/Excel)" type="file" />
        <input className={inputClass} name="bulkUpdate" placeholder="Bulk Category Update" type="file" />
      </div>
    </section>

    {/* 7️⃣ Advanced Features */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>7️⃣</span> Advanced Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="categoryInsights" placeholder="Category Performance Insights" />
        <input className={inputClass} name="salesPerCategory" placeholder="Sales per Category" />
        <input className={inputClass} name="topProducts" placeholder="Top Products in Category" />
        <input className={inputClass} name="multiLanguage" placeholder="Multi-language Support" />
        <input className={inputClass} name="marketplaceSync" placeholder="Marketplace Sync (Amazon, Flipkart, etc.)" />
        <input className={inputClass} name="aiCategorySuggestion" placeholder="AI Category Suggestion" />
      </div>
    </section>

    <div className="pt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
      <button type="submit" className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-8 py-3 rounded-lg font-bold hover:from-pink-700 hover:to-pink-800 transition w-full sm:w-auto shadow">Save Category</button>
      <button type="reset" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition w-full sm:w-auto shadow">Reset</button>
    </div>
  </form>
);

export default CategoriesFormFields;
