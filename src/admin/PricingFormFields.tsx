import React from 'react';

const inputClass = "input bg-white border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full placeholder-gray-400";
const sectionClass = "bg-white/80 rounded-2xl shadow p-6 mb-6 border border-blue-100";
const sectionHeaderClass = "flex items-center gap-2 text-xl font-bold mb-4 text-blue-800";

const PricingFormFields = () => (
  <form className="space-y-8 w-full max-w-5xl mx-auto px-2 sm:px-4">
    {/* 1️⃣ Basic Price Details */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>1️⃣</span> Basic Price Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="sku" placeholder="SKU (linked to product listing)" required />
        <input className={inputClass} name="title" placeholder="Product Title" />
        <input className={inputClass} name="asin" placeholder="ASIN / Product ID" />
        <input className={inputClass} name="category" placeholder="Category / Subcategory" />
      </div>
    </section>

    {/* 2️⃣ Pricing Structure */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>2️⃣</span> Pricing Structure</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="regularPrice" placeholder="Regular Price (Base selling price)" type="number" />
        <input className={inputClass} name="discountPrice" placeholder="Discount / Offer Price" type="number" />
        <input className={inputClass} name="strikePrice" placeholder="Strike-through Price (Old price)" type="number" />
        <input className={inputClass} name="minSellingPrice" placeholder="Minimum Selling Price (MSP)" type="number" />
        <input className={inputClass} name="maxSellingPrice" placeholder="Maximum Selling Price (Ceiling Price)" type="number" />
        <input className={inputClass} name="unitPrice" placeholder="Unit Price (per kg, per litre, etc.)" type="number" />
      </div>
    </section>

    {/* 3️⃣ Promotional Pricing */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>3️⃣</span> Promotional Pricing</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="offerStart" placeholder="Offer Start Date" type="date" />
        <input className={inputClass} name="offerEnd" placeholder="Offer End Date" type="date" />
        <input className={inputClass} name="flashSalePrice" placeholder="Flash Sale Pricing" type="number" />
        <input className={inputClass} name="bundlePrice" placeholder="Bundle / Combo Price" type="number" />
        <input className={inputClass} name="quantityDiscounts" placeholder="Quantity Discounts (Buy 2 Get X% Off)" />
        <input className={inputClass} name="couponDiscount" placeholder="Coupon Discount % / Flat Amount" />
      </div>
    </section>

    {/* 4️⃣ Tax & Fees */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>4️⃣</span> Tax & Fees</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="taxVat" placeholder="Tax / VAT %" type="number" />
        <input className={inputClass} name="gst" placeholder="GST % (India-specific)" type="number" />
        <input className={inputClass} name="marketplaceCommission" placeholder="Marketplace Commission %" type="number" />
        <input className={inputClass} name="fulfillmentFee" placeholder="Fulfillment Fee (FBA or warehouse charges)" type="number" />
        <input className={inputClass} name="otherCharges" placeholder="Other Charges (packaging, handling)" type="number" />
      </div>
    </section>

    {/* 5️⃣ Cost & Profit Analysis */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>5️⃣</span> Cost & Profit Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="costPrice" placeholder="Cost Price (Per Unit)" type="number" />
        <input className={inputClass} name="currentSellingPrice" placeholder="Current Selling Price" type="number" />
        <input className={inputClass} name="profitPerUnit" placeholder="Profit Per Unit" type="number" />
        <input className={inputClass} name="profitMargin" placeholder="Profit Margin %" type="number" />
        <input className={inputClass} name="breakEvenPrice" placeholder="Break-even Price" type="number" />
      </div>
    </section>

    {/* 6️⃣ Dynamic & Automated Pricing */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>6️⃣</span> Dynamic & Automated Pricing</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="autoRepricingRules" placeholder="Auto Repricing Rules" />
        <input className={inputClass} name="matchLowestCompetitor" placeholder="Match Lowest Competitor Price" />
        <input className={inputClass} name="beatCompetitor" placeholder="Beat Competitor by Fixed % / Amount" />
        <input className={inputClass} name="maintainMargin" placeholder="Maintain Fixed Margin" />
        <input className={inputClass} name="priceChangeHistory" placeholder="Price Change History (date-wise)" />
        <input className={inputClass} name="competitorTracking" placeholder="Competitor Price Tracking (Amazon, Flipkart, etc.)" />
      </div>
    </section>

    {/* 7️⃣ Status & Alerts */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>7️⃣</span> Status & Alerts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="priceDropAlert" placeholder="Price Drop Alerts" />
        <input className={inputClass} name="marginAlert" placeholder="Margin Alert" />
        <input className={inputClass} name="outOfRangeAlert" placeholder="Out of Range Alert" />
      </div>
    </section>

    {/* 8️⃣ Bulk Pricing Management */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>8️⃣</span> Bulk Pricing Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="bulkPriceUpdate" placeholder="Bulk Price Update (CSV/Excel)" type="file" />
        <input className={inputClass} name="bulkDiscount" placeholder="Bulk Discount Application" />
        <input className={inputClass} name="bulkRulePricing" placeholder="Bulk Rule-Based Pricing" />
      </div>
    </section>

    <div className="pt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
      <button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition w-full sm:w-auto shadow">Save Pricing</button>
      <button type="reset" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition w-full sm:w-auto shadow">Reset</button>
    </div>
  </form>
);

export default PricingFormFields;
