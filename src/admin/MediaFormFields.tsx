import React from 'react';

const inputClass = "input bg-white border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full placeholder-gray-400";
const sectionClass = "bg-white/80 rounded-2xl shadow p-6 mb-6 border border-blue-100";
const sectionHeaderClass = "flex items-center gap-2 text-xl font-bold mb-4 text-blue-800";

const MediaFormFields = () => (
  <form className="space-y-8 w-full max-w-5xl mx-auto px-2 sm:px-4">
    {/* 1️⃣ Basic Media Details */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>1️⃣</span> Basic Media Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="sku" placeholder="SKU (linked to product)" required />
        <input className={inputClass} name="title" placeholder="Product Title" />
        <input className={inputClass} name="asin" placeholder="ASIN / Product ID" />
        <input className={inputClass} name="category" placeholder="Category / Subcategory" />
      </div>
    </section>

    {/* 2️⃣ Image Types */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>2️⃣</span> Image Types</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="mainImage" placeholder="Main Product Image (Hero)" type="file" accept="image/*" />
        <input className={inputClass} name="additionalImages" placeholder="Additional Images (multiple)" type="file" accept="image/*" multiple />
        <input className={inputClass} name="lifestyleImages" placeholder="Lifestyle Images" type="file" accept="image/*" multiple />
        <input className={inputClass} name="infographicImages" placeholder="Infographic Images" type="file" accept="image/*" multiple />
        <input className={inputClass} name="view360" placeholder="360° Images" type="file" accept="image/*" multiple />
        <input className={inputClass} name="packagingImages" placeholder="Packaging Images" type="file" accept="image/*" multiple />
      </div>
    </section>

    {/* 3️⃣ Video Types */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>3️⃣</span> Video Types</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="demoVideo" placeholder="Product Demo Video" type="file" accept="video/*" />
        <input className={inputClass} name="howToVideo" placeholder="How-to / Tutorial Video" type="file" accept="video/*" />
        <input className={inputClass} name="unboxingVideo" placeholder="Unboxing Video" type="file" accept="video/*" />
        <input className={inputClass} name="reviewVideo" placeholder="Customer Review Video" type="file" accept="video/*" />
        <input className={inputClass} name="adVideo" placeholder="Advertisement Video" type="file" accept="video/*" />
      </div>
    </section>

    {/* 4️⃣ File Management */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>4️⃣</span> File Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="dragDrop" placeholder="Drag & Drop Upload (not functional)" type="file" multiple />
        <input className={inputClass} name="bulkUpload" placeholder="Bulk Upload (Multiple Images/Videos)" type="file" multiple />
        <input className={inputClass} name="imageReorder" placeholder="Image Reordering (Set Display Order)" />
        <input className={inputClass} name="replaceMedia" placeholder="Replace Existing Image / Video" type="file" />
        <input className={inputClass} name="deleteMedia" placeholder="Delete Media (select to remove)" />
        <input className={inputClass} name="previewMedia" placeholder="Preview Before Publishing" />
      </div>
    </section>

    {/* 5️⃣ Guidelines & Validation */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>5️⃣</span> Guidelines & Validation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="fileFormat" placeholder="File Format Validation (JPG, PNG, WEBP, MP4, MOV)" />
        <input className={inputClass} name="maxFileSize" placeholder="Max File Size Check (Image ≤ 2MB, Video ≤ 100MB)" />
        <input className={inputClass} name="resolutionCheck" placeholder="Resolution Check (1000×1000 px min)" />
        <input className={inputClass} name="aspectRatio" placeholder="Aspect Ratio Check (1:1 for main image)" />
        <input className={inputClass} name="backgroundCheck" placeholder="Background Check (White for hero image)" />
      </div>
    </section>

    {/* 6️⃣ Metadata & SEO */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>6️⃣</span> Metadata & SEO</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="altText" placeholder="Image Alt Text (SEO & accessibility)" />
        <input className={inputClass} name="videoTitle" placeholder="Video Title" />
        <input className={inputClass} name="videoDescription" placeholder="Video Description" />
        <input className={inputClass} name="tags" placeholder="Tags / Keywords (internal search)" />
      </div>
    </section>

    {/* 7️⃣ Advanced Features */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>7️⃣</span> Advanced Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="imageOptimization" placeholder="Automatic Image Optimization" />
        <input className={inputClass} name="aiBackgroundRemoval" placeholder="AI Background Removal" />
        <input className={inputClass} name="imageWatermarking" placeholder="Image Watermarking" />
        <input className={inputClass} name="marketplaceSync" placeholder="Marketplace Sync (Amazon, Flipkart, etc.)" />
        <input className={inputClass} name="mediaLibrarySearch" placeholder="Media Library Search (by SKU, title, tag)" />
      </div>
    </section>

    <div className="pt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
      <button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition w-full sm:w-auto shadow">Save Media</button>
      <button type="reset" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition w-full sm:w-auto shadow">Reset</button>
    </div>
  </form>
);

export default MediaFormFields;
