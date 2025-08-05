// import React from 'react';

const inputClass = "input bg-white border border-green-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 transition w-full placeholder-gray-400";
const sectionClass = "bg-white/80 rounded-2xl shadow p-6 mb-6 border border-green-100";
const sectionHeaderClass = "flex items-center gap-2 text-xl font-bold mb-4 text-green-800";


const SeoFormFields = () => (
  <form className="space-y-8 w-full max-w-5xl mx-auto px-2 sm:px-4">
    {/* 1️⃣ Basic SEO Fields */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>1️⃣</span> Basic SEO Fields</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="seoTitle" placeholder="Product Title (SEO Optimized)" maxLength={200} required />
        <input className={inputClass} name="seoBullet1" placeholder="Bullet Point 1 (Keyword-rich)" maxLength={200} />
        <input className={inputClass} name="seoBullet2" placeholder="Bullet Point 2" maxLength={200} />
        <input className={inputClass} name="seoBullet3" placeholder="Bullet Point 3" maxLength={200} />
        <input className={inputClass} name="seoBullet4" placeholder="Bullet Point 4" maxLength={200} />
        <input className={inputClass} name="seoBullet5" placeholder="Bullet Point 5" maxLength={200} />
        <textarea className={inputClass} name="seoDescription" placeholder="Product Description (HTML supported)" rows={3} />
        <input className={inputClass} name="backendKeywords" placeholder="Backend Search Keywords (space separated)" />
        <input className={inputClass} name="metaTitle" placeholder="Meta Title (for search engines)" />
        <input className={inputClass} name="metaDescription" placeholder="Meta Description (short summary)" />
        <input className={inputClass} name="imageAltText" placeholder="Image Alt Text (for all images)" />
      </div>
    </section>

    {/* 2️⃣ Keyword Management */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>2️⃣</span> Keyword Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="primaryKeywords" placeholder="Primary Keywords (comma separated)" />
        <input className={inputClass} name="secondaryKeywords" placeholder="Secondary Keywords (comma separated)" />
        <input className={inputClass} name="longTailKeywords" placeholder="Long-tail Keywords (comma separated)" />
        <input className={inputClass} name="competitorKeywords" placeholder="Competitor Keywords (comma separated)" />
        <input className={inputClass} name="searchVolume" placeholder="Search Volume Insights (optional)" />
        <input className={inputClass} name="keywordDensity" placeholder="Keyword Density (%)" type="number" min={0} max={100} />
      </div>
    </section>

    {/* 3️⃣ Listing Quality & Optimization Score */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>3️⃣</span> Listing Quality & Optimization Score</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="seoScore" placeholder="SEO Score (0-100)" type="number" min={0} max={100} />
        <input className={inputClass} name="titleLength" placeholder="Title Length (chars)" type="number" />
        <input className={inputClass} name="imageCount" placeholder="Image Count" type="number" />
        <input className={inputClass} name="bulletCoverage" placeholder="Bullet Point Coverage (1-5)" type="number" min={1} max={5} />
        <input className={inputClass} name="keywordUsage" placeholder="Keyword Usage (main keywords used?)" />
      </div>
    </section>

    {/* 4️⃣ Content Enhancements */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>4️⃣</span> Content Enhancements</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="aPlusContent" placeholder="A+ / Enhanced Brand Content (Yes/No)" />
        <input className={inputClass} name="comparisonTable" placeholder="Comparison Table Included? (Yes/No)" />
        <input className={inputClass} name="richMedia" placeholder="Rich Media (infographics, videos, GIFs)" />
        <input className={inputClass} name="faqSection" placeholder="FAQ Section (Yes/No)" />
      </div>
    </section>

    {/* 5️⃣ Competitor & Market Research */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>5️⃣</span> Competitor & Market Research</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="competitorAnalysis" placeholder="Competitor Listing Analysis" />
        <input className={inputClass} name="topSellerKeywords" placeholder="Top Seller Keyword Insights" />
        <input className={inputClass} name="searchRankTracking" placeholder="Search Rank Tracking" />
      </div>
    </section>

    {/* 6️⃣ Advanced SEO Features */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>6️⃣</span> Advanced SEO Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="aiSuggestions" placeholder="AI Content Suggestions" />
        <input className={inputClass} name="keywordGap" placeholder="Keyword Gap Analysis" />
        <input className={inputClass} name="autoKeywordPlacement" placeholder="Automated Keyword Placement" />
        <input className={inputClass} name="searchIntent" placeholder="Search Intent Matching" />
      </div>
    </section>

    <div className="pt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
      <button type="submit" className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition w-full sm:w-auto shadow">Save SEO</button>
      <button type="reset" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition w-full sm:w-auto shadow">Reset</button>
    </div>
  </form>
);

export default SeoFormFields;
