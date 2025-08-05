import React from 'react';

const inputClass = "input bg-white border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full placeholder-gray-400";
const sectionClass = "bg-white/80 rounded-2xl shadow p-6 mb-6 border border-blue-100";
const sectionHeaderClass = "flex items-center gap-2 text-xl font-bold mb-4 text-blue-800";

const InventoryFormFields = () => (
  <form className="space-y-8 w-full max-w-5xl mx-auto px-2 sm:px-4">
    {/* 1️⃣ Basic Inventory Details */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>1️⃣</span> Basic Inventory Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="sku" placeholder="SKU (Stock Keeping Unit)" required />
        <input className={inputClass} name="title" placeholder="Product Title (linked from listing)" />
        <input className={inputClass} name="asin" placeholder="ASIN / Product ID" />
        <input className={inputClass} name="category" placeholder="Category / Subcategory" />
      </div>
    </section>

    {/* 2️⃣ Stock Information */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>2️⃣</span> Stock Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="availableStock" placeholder="Available Stock Quantity" type="number" />
        <input className={inputClass} name="reservedStock" placeholder="Reserved Stock" type="number" />
        <input className={inputClass} name="damagedStock" placeholder="Damaged / Unsellable Stock" type="number" />
        <input className={inputClass} name="safetyStock" placeholder="Safety Stock Level (alert threshold)" type="number" />
        <input className={inputClass} name="reorderPoint" placeholder="Reorder Point" type="number" />
        <input className={inputClass} name="maxCapacity" placeholder="Maximum Stock Capacity (per warehouse)" type="number" />
      </div>
    </section>

    {/* 3️⃣ Location & Storage */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>3️⃣</span> Location & Storage</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="warehouseName" placeholder="Warehouse Name / ID" />
        <input className={inputClass} name="storageBin" placeholder="Storage Bin / Shelf Location" />
        <input className={inputClass} name="fulfillmentCenter" placeholder="Fulfillment Center (FBA, self-fulfilled, etc.)" />
        <input className={inputClass} name="batchNumber" placeholder="Batch / Lot Number" />
        <input className={inputClass} name="expirationDate" placeholder="Expiration Date" type="date" />
      </div>
    </section>

    {/* 4️⃣ Stock Movement & Tracking */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>4️⃣</span> Stock Movement & Tracking</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="lastRestock" placeholder="Last Restock Date" type="date" />
        <input className={inputClass} name="nextRestock" placeholder="Next Expected Restock Date" type="date" />
        <input className={inputClass} name="incomingStock" placeholder="Incoming Stock Quantity" type="number" />
        <input className={inputClass} name="supplierName" placeholder="Supplier Name / ID" />
        <input className={inputClass} name="purchaseOrder" placeholder="Purchase Order Number" />
      </div>
      <textarea className={inputClass} name="stockHistory" placeholder="Stock History Log (in/out record with timestamps)" rows={2} />
    </section>

    {/* 5️⃣ Pricing & Value */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>5️⃣</span> Pricing & Value</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="unitCost" placeholder="Unit Cost Price" type="number" />
        <input className={inputClass} name="sellingPrice" placeholder="Current Selling Price" type="number" />
        <input className={inputClass} name="totalStockValue" placeholder="Total Stock Value (Quantity × Cost Price)" type="number" />
        <input className={inputClass} name="profitMargin" placeholder="Profit Margin %" type="number" />
      </div>
    </section>

    {/* 6️⃣ Status & Alerts */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>6️⃣</span> Status & Alerts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="inventoryStatus" placeholder="Inventory Status (In Stock, Low Stock, etc.)" />
        <input className={inputClass} name="stockAgeing" placeholder="Stock Ageing Report" />
        <input className={inputClass} name="slowMovingFlag" placeholder="Slow-moving Items Flag" />
        <input className={inputClass} name="overstockAlerts" placeholder="Overstock Alerts" />
      </div>
    </section>

    {/* 7️⃣ Bulk Inventory Management */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>7️⃣</span> Bulk Inventory Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="bulkUpload" placeholder="Bulk Stock Upload (CSV/Excel)" type="file" />
        <input className={inputClass} name="bulkQtyUpdate" placeholder="Bulk Quantity Update" />
        <input className={inputClass} name="bulkPriceUpdate" placeholder="Bulk Price Update" />
        <input className={inputClass} name="bulkStatusChange" placeholder="Bulk Status Change (Activate/Deactivate)" />
      </div>
    </section>

    {/* 8️⃣ Advanced Features */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>8️⃣</span> Advanced Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="multiWarehouseSync" placeholder="Multi-warehouse Stock Sync" />
        <input className={inputClass} name="autoReorder" placeholder="Auto Reorder Integration (supplier API link)" />
        <input className={inputClass} name="salesVelocity" placeholder="Sales Velocity Tracking (units/day)" />
        <input className={inputClass} name="demandForecasting" placeholder="Demand Forecasting (AI-based prediction)" />
        <input className={inputClass} name="marketplaceSync" placeholder="Marketplace Sync (Amazon, Flipkart, Shopify, etc.)" />
      </div>
    </section>

    <div className="pt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
      <button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition w-full sm:w-auto shadow">Save Inventory</button>
      <button type="reset" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition w-full sm:w-auto shadow">Reset</button>
    </div>
  </form>
);

export default InventoryFormFields;
