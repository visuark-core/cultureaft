

const inputClass = "input bg-white border border-purple-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 transition w-full placeholder-gray-400";
const sectionClass = "bg-white/80 rounded-2xl shadow p-6 mb-6 border border-purple-100";
const sectionHeaderClass = "flex items-center gap-2 text-xl font-bold mb-4 text-purple-800";

const OrdersFormFields = () => (
  <form className="space-y-8 w-full max-w-5xl mx-auto px-2 sm:px-4">
    {/* 1️⃣ Basic Order Details */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>1️⃣</span> Basic Order Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="orderId" placeholder="Order ID" />
        <input className={inputClass} name="orderDateTime" placeholder="Order Date & Time" type="datetime-local" />
        <input className={inputClass} name="customerName" placeholder="Customer Name" />
        <input className={inputClass} name="customerEmail" placeholder="Customer Email" type="email" />
        <input className={inputClass} name="customerPhone" placeholder="Customer Phone" type="tel" />
        <input className={inputClass} name="shippingAddress" placeholder="Shipping Address" />
        <input className={inputClass} name="billingAddress" placeholder="Billing Address" />
        <input className={inputClass} name="orderSource" placeholder="Order Source (Amazon, Website, etc.)" />
      </div>
    </section>

    {/* 2️⃣ Product Information */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>2️⃣</span> Product Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="productTitle" placeholder="Product Title" />
        <input className={inputClass} name="sku" placeholder="SKU" />
        <input className={inputClass} name="asin" placeholder="ASIN / Product ID" />
        <input className={inputClass} name="quantityOrdered" placeholder="Quantity Ordered" type="number" />
        <input className={inputClass} name="unitPrice" placeholder="Unit Price" type="number" />
        <input className={inputClass} name="totalPrice" placeholder="Total Price" type="number" />
      </div>
    </section>

    {/* 3️⃣ Payment Details */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>3️⃣</span> Payment Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="paymentMethod" placeholder="Payment Method (Credit Card, UPI, etc.)" />
        <select className={inputClass} name="paymentStatus" defaultValue="">
          <option value="" disabled>Payment Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <input className={inputClass} name="transactionId" placeholder="Transaction ID" />
        <input className={inputClass} name="currency" placeholder="Currency" />
      </div>
    </section>

    {/* 4️⃣ Shipping & Fulfillment */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>4️⃣</span> Shipping & Fulfillment</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="shippingMethod" placeholder="Shipping Method (Standard, Expedited, etc.)" />
        <input className={inputClass} name="fulfillmentType" placeholder="Fulfillment Type (FBA, FBM, Self-fulfilled)" />
        <input className={inputClass} name="courierPartner" placeholder="Courier / Shipping Partner" />
        <input className={inputClass} name="trackingNumber" placeholder="Tracking Number" />
        <input className={inputClass} name="trackingUrl" placeholder="Tracking URL" />
        <input className={inputClass} name="expectedDelivery" placeholder="Expected Delivery Date" type="date" />
        <input className={inputClass} name="shippingCharges" placeholder="Shipping Charges" type="number" />
      </div>
    </section>

    {/* 5️⃣ Order Status Tracking */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>5️⃣</span> Order Status Tracking</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <select className={inputClass} name="orderStatus" defaultValue="">
          <option value="" disabled>Order Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="outForDelivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="returned">Returned</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <textarea className={inputClass} name="statusHistory" placeholder="Status Update History (timestamps for each stage)" rows={2} />
      </div>
    </section>

    {/* 6️⃣ Returns & Refunds */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>6️⃣</span> Returns & Refunds</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="returnRequestDate" placeholder="Return Request Date" type="date" />
        <input className={inputClass} name="returnReason" placeholder="Return Reason" />
        <input className={inputClass} name="refundAmount" placeholder="Refund Amount" type="number" />
        <input className={inputClass} name="refundMethod" placeholder="Refund Method" />
        <select className={inputClass} name="refundStatus" defaultValue="">
          <option value="" disabled>Refund Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </section>

    {/* 7️⃣ Performance & Alerts */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>7️⃣</span> Performance & Alerts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="lateShipmentAlert" placeholder="Late Shipment Alerts" />
        <input className={inputClass} name="unfulfilledOrders" placeholder="Unfulfilled Orders Report" />
        <input className={inputClass} name="cancelledOrders" placeholder="Cancelled Orders Tracking" />
        <input className={inputClass} name="customerFeedback" placeholder="Customer Feedback / Review Link" />
      </div>
    </section>

    {/* 8️⃣ Advanced Features */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>8️⃣</span> Advanced Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="bulkStatusUpdate" placeholder="Bulk Order Status Update" />
        <input className={inputClass} name="orderFiltering" placeholder="Order Filtering & Search" />
        <input className={inputClass} name="exportOrders" placeholder="Export Orders (CSV, Excel, PDF)" />
        <input className={inputClass} name="salesInsights" placeholder="Sales Insights (orders per day/week/month)" />
        <input className={inputClass} name="topSellingProducts" placeholder="Top-selling Products" />
        <input className={inputClass} name="multiChannelSync" placeholder="Multi-channel Order Sync (Amazon, Flipkart, etc.)" />
      </div>
    </section>

    <div className="pt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
      <button type="submit" className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-lg font-bold hover:from-purple-700 hover:to-purple-800 transition w-full sm:w-auto shadow">Save Order</button>
      <button type="reset" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition w-full sm:w-auto shadow">Reset</button>
    </div>
  </form>
);

export default OrdersFormFields;
