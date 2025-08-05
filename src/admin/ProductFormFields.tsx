import React from 'react';

const inputClass = "input bg-white border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full placeholder-gray-400";
const sectionClass = "bg-white/80 rounded-2xl shadow p-6 mb-6 border border-blue-100";
const sectionHeaderClass = "flex items-center gap-2 text-xl font-bold mb-4 text-blue-800";

const ProductFormFields = () => (
  <form className="space-y-8 w-full max-w-5xl mx-auto px-2 sm:px-4">
    {/* 1️⃣ Product Identification */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>1️⃣</span> Product Identification</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="title" placeholder="Product Title / Name" required />
        <input className={inputClass} name="brand" placeholder="Brand Name" />
        <input className={inputClass} name="sku" placeholder="SKU (Stock Keeping Unit)" />
        <input className={inputClass} name="productId" placeholder="Product ID (ASIN, UPC, EAN, ISBN, or GTIN)" />
        <input className={inputClass} name="category" placeholder="Category & Subcategory" />
        <input className={inputClass} name="modelNumber" placeholder="Product Type / Model Number" />
        <input className={inputClass} name="parentChild" placeholder="Parent / Child Relationship (for variations)" />
      </div>
    </section>

    {/* 2️⃣ Product Description & Content */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>2️⃣</span> Product Description & Content</h3>
      <textarea className={inputClass} name="description" placeholder="Product Description (long text)" rows={3} />
      <input className={inputClass} name="keyFeatures" placeholder="Key Features / Bullet Points (comma separated)" />
      <input className={inputClass} name="highlights" placeholder="Highlights (extra selling points)" />
      <input className={inputClass} name="searchKeywords" placeholder="Search Keywords (backend, not visible)" />
      <input className={inputClass} name="metaTitle" placeholder="Meta Title (SEO)" />
      <input className={inputClass} name="metaDescription" placeholder="Meta Description (SEO)" />
      <input className={inputClass} name="manufacturer" placeholder="Manufacturer Name" />
      <input className={inputClass} name="warranty" placeholder="Warranty Information" />
      <input className={inputClass} name="instructions" placeholder="Instructions Manual (PDF / Text)" type="file" />
    </section>

    {/* 3️⃣ Pricing & Offers */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>3️⃣</span> Pricing & Offers</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="regularPrice" placeholder="Regular Price" type="number" />
        <input className={inputClass} name="discountPrice" placeholder="Discount / Sale Price" type="number" />
        <input className={inputClass} name="minPrice" placeholder="Minimum Price (for repricing)" type="number" />
        <input className={inputClass} name="maxPrice" placeholder="Maximum Price (for repricing)" type="number" />
        <input className={inputClass} name="currency" placeholder="Currency (e.g. INR, USD)" />
        <input className={inputClass} name="offerStart" placeholder="Offer Start Date" type="date" />
        <input className={inputClass} name="offerEnd" placeholder="Offer End Date" type="date" />
        <input className={inputClass} name="taxVat" placeholder="Tax/VAT Details" />
      </div>
    </section>

    {/* 4️⃣ Inventory & Stock */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>4️⃣</span> Inventory & Stock</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="stockQty" placeholder="Stock Quantity" type="number" />
        <input className={inputClass} name="warehouse" placeholder="Warehouse Location" />
        <input className={inputClass} name="safetyStock" placeholder="Safety Stock Level (alert threshold)" type="number" />
        <input className={inputClass} name="restockDate" placeholder="Restock Date" type="date" />
        <input className={inputClass} name="fulfillmentType" placeholder="Fulfillment Type (FBA, FBM, Self-shipping)" />
      </div>
    </section>

    {/* 5️⃣ Shipping & Delivery */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>5️⃣</span> Shipping & Delivery</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="handlingTime" placeholder="Handling Time (Days to Dispatch)" type="number" />
        <input className={inputClass} name="shippingWeight" placeholder="Shipping Weight" type="number" />
        <input className={inputClass} name="packageDimensions" placeholder="Package Dimensions (L × W × H)" />
        <input className={inputClass} name="shippingTemplate" placeholder="Shipping Template (Standard, Expedited, etc.)" />
        <input className={inputClass} name="deliveryAvailability" placeholder="Delivery Availability (Pincode / Country)" />
      </div>
    </section>

    {/* 6️⃣ Media & Visuals */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>6️⃣</span> Media & Visuals</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="mainImage" placeholder="Main Product Image (Hero)" type="file" />
        <input className={inputClass} name="additionalImages" placeholder="Additional Images (multiple)" type="file" multiple />
        <input className={inputClass} name="lifestyleImages" placeholder="Lifestyle Images" type="file" multiple />
        <input className={inputClass} name="infographicImages" placeholder="Infographic Images" type="file" multiple />
        <input className={inputClass} name="view360" placeholder="360° View Images" type="file" multiple />
        <input className={inputClass} name="productVideos" placeholder="Product Videos" type="file" multiple />
      </div>
    </section>

    {/* 7️⃣ Variations (If Applicable) */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>7️⃣</span> Variations (If Applicable)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="sizeOptions" placeholder="Size Options" />
        <input className={inputClass} name="colorOptions" placeholder="Color Options" />
        <input className={inputClass} name="styleOptions" placeholder="Style Options" />
        <input className={inputClass} name="materialType" placeholder="Material Type" />
        <input className={inputClass} name="quantityPacks" placeholder="Quantity Packs (1 pack, 2 pack, etc.)" />
      </div>
    </section>

    {/* 8️⃣ Compliance & Legal */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>8️⃣</span> Compliance & Legal</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="countryOfOrigin" placeholder="Country of Origin" />
        <input className={inputClass} name="complianceCertificates" placeholder="Compliance Certificates (PDF)" type="file" multiple />
        <input className={inputClass} name="expiryDate" placeholder="Expiry Date (for perishables)" type="date" />
        <input className={inputClass} name="safetyWarnings" placeholder="Safety Warnings" />
        <input className={inputClass} name="ageRestrictions" placeholder="Age Restrictions" />
        <input className={inputClass} name="productCondition" placeholder="Product Condition (New, Refurbished, Used)" />
      </div>
    </section>

    {/* 9️⃣ Extra Attributes (Advanced Sellers) */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>9️⃣</span> Extra Attributes (Advanced Sellers)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="customTags" placeholder="Custom Tags / Labels" />
        <input className={inputClass} name="seasonalAvailability" placeholder="Seasonal Availability (Summer, Winter, etc.)" />
        <input className={inputClass} name="assemblyRequired" placeholder="Assembly Required (Yes/No)" />
        <input className={inputClass} name="includedItems" placeholder="Included Items in Box" />
        <input className={inputClass} name="careInstructions" placeholder="Care Instructions" />
        <input className={inputClass} name="returnPolicy" placeholder="Return Policy" />
      </div>
    </section>

    <div className="pt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
      <button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition w-full sm:w-auto shadow">Save Product</button>
      <button type="reset" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition w-full sm:w-auto shadow">Reset</button>
    </div>
  </form>
);

export default ProductFormFields;
