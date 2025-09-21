import React from 'react';

const inputClass = "input bg-white border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full placeholder-gray-400";
const sectionClass = "bg-white/80 rounded-2xl shadow p-6 mb-6 border border-blue-100";
const sectionHeaderClass = "flex items-center gap-2 text-xl font-bold mb-4 text-blue-800";


const ProductFormFields = () => {
  const [form, setForm] = React.useState<any>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, files } = e.target as HTMLInputElement;
    if (type === 'file') {
      setForm((prev: any) => ({ ...prev, [name]: files }));
    } else {
      setForm((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => {
            formData.append(key, file);
          });
        } else if (typeof value === 'string') {
          formData.append(key, value);
        } else if (typeof value === 'number') {
          formData.append(key, value.toString());
        }
      });
      const res = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to save product');
      setSuccess('Product saved!');
      setForm({});
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-8 w-full max-w-5xl mx-auto px-2 sm:px-4" onSubmit={handleSubmit} encType="multipart/form-data">
      {/* 1️⃣ Product Identification */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}><span>1️⃣</span> Product Identification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <input className={inputClass} name="title" placeholder="Product Title / Name" required onChange={handleChange} />
          <input className={inputClass} name="brand" placeholder="Brand Name" onChange={handleChange} />
          <input className={inputClass} name="sku" placeholder="SKU (Stock Keeping Unit)" onChange={handleChange} />
          <input className={inputClass} name="productId" placeholder="Product ID (ASIN, UPC, EAN, ISBN, or GTIN)" onChange={handleChange} />
          <input className={inputClass} name="category" placeholder="Category & Subcategory" onChange={handleChange} />
          <input className={inputClass} name="modelNumber" placeholder="Product Type / Model Number" onChange={handleChange} />
          <input className={inputClass} name="parentChild" placeholder="Parent / Child Relationship (for variations)" onChange={handleChange} />
        </div>
      </section>

      {/* 2️⃣ Product Description & Content */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}><span>2️⃣</span> Product Description & Content</h3>
        <textarea className={inputClass} name="description" placeholder="Product Description (long text)" rows={3} onChange={handleChange} />
        <input className={inputClass} name="keyFeatures" placeholder="Key Features / Bullet Points (comma separated)" onChange={handleChange} />
        <input className={inputClass} name="highlights" placeholder="Highlights (extra selling points)" onChange={handleChange} />
        <input className={inputClass} name="searchKeywords" placeholder="Search Keywords (backend, not visible)" onChange={handleChange} />
        <input className={inputClass} name="metaTitle" placeholder="Meta Title (SEO)" onChange={handleChange} />
        <input className={inputClass} name="metaDescription" placeholder="Meta Description (SEO)" onChange={handleChange} />
        <input className={inputClass} name="manufacturer" placeholder="Manufacturer Name" onChange={handleChange} />
        <input className={inputClass} name="warranty" placeholder="Warranty Information" onChange={handleChange} />
        <input className={inputClass} name="instructions" placeholder="Instructions Manual (PDF / Text)" type="file" onChange={handleChange} />
      </section>

      {/* 3️⃣ Pricing & Offers */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}><span>3️⃣</span> Pricing & Offers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <input className={inputClass} name="regularPrice" placeholder="Regular Price" type="number" onChange={handleChange} />
          <input className={inputClass} name="discountPrice" placeholder="Discount / Sale Price" type="number" onChange={handleChange} />
          <input className={inputClass} name="minPrice" placeholder="Minimum Price (for repricing)" type="number" onChange={handleChange} />
          <input className={inputClass} name="maxPrice" placeholder="Maximum Price (for repricing)" type="number" onChange={handleChange} />
          <input className={inputClass} name="currency" placeholder="Currency (e.g. INR, USD)" onChange={handleChange} />
          <input className={inputClass} name="offerStart" placeholder="Offer Start Date" type="date" onChange={handleChange} />
          <input className={inputClass} name="offerEnd" placeholder="Offer End Date" type="date" onChange={handleChange} />
          <input className={inputClass} name="taxVat" placeholder="Tax/VAT Details" onChange={handleChange} />
        </div>
      </section>

      {/* 4️⃣ Inventory & Stock */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}><span>4️⃣</span> Inventory & Stock</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <input className={inputClass} name="stockQty" placeholder="Stock Quantity" type="number" onChange={handleChange} />
          <input className={inputClass} name="warehouse" placeholder="Warehouse Location" onChange={handleChange} />
          <input className={inputClass} name="safetyStock" placeholder="Safety Stock Level (alert threshold)" type="number" onChange={handleChange} />
          <input className={inputClass} name="restockDate" placeholder="Restock Date" type="date" onChange={handleChange} />
          <input className={inputClass} name="fulfillmentType" placeholder="Fulfillment Type (FBA, FBM, Self-shipping)" onChange={handleChange} />
        </div>
      </section>

      {/* 5️⃣ Shipping & Delivery */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}><span>5️⃣</span> Shipping & Delivery</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <input className={inputClass} name="handlingTime" placeholder="Handling Time (Days to Dispatch)" type="number" onChange={handleChange} />
          <input className={inputClass} name="shippingWeight" placeholder="Shipping Weight" type="number" onChange={handleChange} />
          <input className={inputClass} name="packageDimensions" placeholder="Package Dimensions (L × W × H)" onChange={handleChange} />
          <input className={inputClass} name="shippingTemplate" placeholder="Shipping Template (Standard, Expedited, etc.)" onChange={handleChange} />
          <input className={inputClass} name="deliveryAvailability" placeholder="Delivery Availability (Pincode / Country)" onChange={handleChange} />
        </div>
      </section>

      {/* 6️⃣ Media & Visuals */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}><span>6️⃣</span> Media & Visuals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <input className={inputClass} name="mainImage" placeholder="Main Product Image (Hero)" type="file" onChange={handleChange} />
          <input className={inputClass} name="additionalImages" placeholder="Additional Images (multiple)" type="file" multiple onChange={handleChange} />
          <input className={inputClass} name="lifestyleImages" placeholder="Lifestyle Images" type="file" multiple onChange={handleChange} />
          <input className={inputClass} name="infographicImages" placeholder="Infographic Images" type="file" multiple onChange={handleChange} />
          <input className={inputClass} name="view360" placeholder="360° View Images" type="file" multiple onChange={handleChange} />
          <input className={inputClass} name="productVideos" placeholder="Product Videos" type="file" multiple onChange={handleChange} />
        </div>
      </section>

      {/* 7️⃣ Variations (If Applicable) */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}><span>7️⃣</span> Variations (If Applicable)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <input className={inputClass} name="sizeOptions" placeholder="Size Options" onChange={handleChange} />
          <input className={inputClass} name="colorOptions" placeholder="Color Options" onChange={handleChange} />
          <input className={inputClass} name="styleOptions" placeholder="Style Options" onChange={handleChange} />
          <input className={inputClass} name="materialType" placeholder="Material Type" onChange={handleChange} />
          <input className={inputClass} name="quantityPacks" placeholder="Quantity Packs (1 pack, 2 pack, etc.)" onChange={handleChange} />
        </div>
      </section>

      {/* 8️⃣ Compliance & Legal */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}><span>8️⃣</span> Compliance & Legal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <input className={inputClass} name="countryOfOrigin" placeholder="Country of Origin" onChange={handleChange} />
          <input className={inputClass} name="complianceCertificates" placeholder="Compliance Certificates (PDF)" type="file" multiple onChange={handleChange} />
          <input className={inputClass} name="expiryDate" placeholder="Expiry Date (for perishables)" type="date" onChange={handleChange} />
          <input className={inputClass} name="safetyWarnings" placeholder="Safety Warnings" onChange={handleChange} />
          <input className={inputClass} name="ageRestrictions" placeholder="Age Restrictions" onChange={handleChange} />
          <input className={inputClass} name="productCondition" placeholder="Product Condition (New, Refurbished, Used)" onChange={handleChange} />
        </div>
      </section>

      {/* 9️⃣ Extra Attributes (Advanced Sellers) */}
      <section className={sectionClass}>
        <h3 className={sectionHeaderClass}><span>9️⃣</span> Extra Attributes (Advanced Sellers)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <input className={inputClass} name="customTags" placeholder="Custom Tags / Labels" onChange={handleChange} />
          <input className={inputClass} name="seasonalAvailability" placeholder="Seasonal Availability (Summer, Winter, etc.)" onChange={handleChange} />
          <input className={inputClass} name="assemblyRequired" placeholder="Assembly Required (Yes/No)" onChange={handleChange} />
          <input className={inputClass} name="includedItems" placeholder="Included Items in Box" onChange={handleChange} />
          <input className={inputClass} name="careInstructions" placeholder="Care Instructions" onChange={handleChange} />
          <input className={inputClass} name="returnPolicy" placeholder="Return Policy" onChange={handleChange} />
        </div>
      </section>
      <div className="pt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
        <button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition w-full sm:w-auto shadow" disabled={loading}>{loading ? 'Saving...' : 'Save Product'}</button>
        <button type="reset" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition w-full sm:w-auto shadow" onClick={() => setForm({})}>Reset</button>
      </div>
      {error && <div className="text-red-600 font-bold text-center">{error}</div>}
      {success && <div className="text-green-600 font-bold text-center">{success}</div>}
    </form>
  );
};

export default ProductFormFields;
