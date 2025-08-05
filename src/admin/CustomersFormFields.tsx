// No import to remove, file is correct as is.
const inputClass = "input bg-white border border-indigo-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition w-full placeholder-gray-400";
const sectionClass = "bg-white/80 rounded-2xl shadow p-6 mb-6 border border-indigo-100";
const sectionHeaderClass = "flex items-center gap-2 text-xl font-bold mb-4 text-indigo-800";

const CustomersFormFields = () => (
  <form className="space-y-8 w-full max-w-5xl mx-auto px-2 sm:px-4">
    {/* 1️⃣ Basic Customer Details */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>1️⃣</span> Basic Customer Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="customerId" placeholder="Customer ID (unique)" />
        <input className={inputClass} name="fullName" placeholder="Full Name" />
        <input className={inputClass} name="email" placeholder="Email Address" type="email" />
        <input className={inputClass} name="phone" placeholder="Phone Number" type="tel" />
        <input className={inputClass} name="gender" placeholder="Gender (optional)" />
        <input className={inputClass} name="dob" placeholder="Date of Birth (optional)" type="date" />
      </div>
    </section>

    {/* 2️⃣ Address Details */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>2️⃣</span> Address Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="primaryShipping" placeholder="Primary Shipping Address" />
        <input className={inputClass} name="billingAddress" placeholder="Billing Address" />
        <input className={inputClass} name="savedAddresses" placeholder="Multiple Saved Addresses" />
        <input className={inputClass} name="pincode" placeholder="Pincode / Zip Code" />
        <input className={inputClass} name="city" placeholder="City" />
        <input className={inputClass} name="state" placeholder="State" />
        <input className={inputClass} name="country" placeholder="Country" />
      </div>
    </section>

    {/* 3️⃣ Account Information */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>3️⃣</span> Account Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="accountCreated" placeholder="Account Creation Date" type="date" />
        <input className={inputClass} name="lastLogin" placeholder="Last Login Date" type="date" />
        <select className={inputClass} name="customerStatus" defaultValue="">
          <option value="" disabled>Customer Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
        <input className={inputClass} name="loyaltyTier" placeholder="Loyalty Program Tier (Gold, Silver, Platinum)" />
        <input className={inputClass} name="customerTags" placeholder="Customer Tags (VIP, High-spender, etc.)" />
      </div>
    </section>

    {/* 4️⃣ Order History */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>4️⃣</span> Order History</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="totalOrders" placeholder="Total Orders Placed" type="number" />
        <input className={inputClass} name="totalSpent" placeholder="Total Amount Spent" type="number" />
        <input className={inputClass} name="aov" placeholder="Average Order Value (AOV)" type="number" />
        <input className={inputClass} name="lastOrderDate" placeholder="Last Order Date" type="date" />
        <input className={inputClass} name="orderFrequency" placeholder="Order Frequency (weekly, monthly, etc.)" />
        <input className={inputClass} name="topCategories" placeholder="Top Categories Purchased" />
      </div>
    </section>

    {/* 5️⃣ Communication & Engagement */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>5️⃣</span> Communication & Engagement</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <select className={inputClass} name="newsletter" defaultValue="">
          <option value="" disabled>Newsletter Subscription Status</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <input className={inputClass} name="preferredChannel" placeholder="Preferred Communication Channel (Email, SMS, WhatsApp)" />
        <input className={inputClass} name="lastCampaign" placeholder="Last Campaign Interaction" />
        <input className={inputClass} name="feedbackReviews" placeholder="Feedback & Reviews Given" />
      </div>
    </section>

    {/* 6️⃣ Support & Issues */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>6️⃣</span> Support & Issues</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="supportTickets" placeholder="Support Tickets Raised" />
        <input className={inputClass} name="ticketStatus" placeholder="Ticket Status (Open, Closed, Pending)" />
        <input className={inputClass} name="refundsReturns" placeholder="Refunds & Returns Count" />
        <input className={inputClass} name="complaintsHistory" placeholder="Complaints History" />
      </div>
    </section>

    {/* 7️⃣ Analytics & Insights */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>7️⃣</span> Analytics & Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="ltv" placeholder="Lifetime Value (LTV)" type="number" />
        <input className={inputClass} name="purchaseTrends" placeholder="Purchase Trends (time-based graphs)" />
        <input className={inputClass} name="churnRisk" placeholder="Churn Risk Score" />
        <input className={inputClass} name="recommendedProducts" placeholder="Recommended Products (AI-based)" />
      </div>
    </section>

    {/* 8️⃣ Management Actions */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>8️⃣</span> Management Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="addCustomer" placeholder="Add New Customer (manual entry)" />
        <input className={inputClass} name="editCustomer" placeholder="Edit Customer Info" />
        <input className={inputClass} name="deactivateAccount" placeholder="Deactivate Account" />
        <input className={inputClass} name="exportList" placeholder="Export Customer List (CSV/Excel)" />
        <input className={inputClass} name="bulkEmailSms" placeholder="Bulk Email / SMS Send" />
        <input className={inputClass} name="assignRewards" placeholder="Assign Loyalty Rewards / Coupons" />
      </div>
    </section>

    {/* 9️⃣ Advanced Features */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>9️⃣</span> Advanced Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="segmentation" placeholder="Customer Segmentation (by spend, location, behavior)" />
        <input className={inputClass} name="multiChannelSync" placeholder="Multi-channel Sync (Amazon, Shopify, etc.)" />
        <input className={inputClass} name="aiInsights" placeholder="AI Customer Insights (predict, upsell)" />
      </div>
    </section>

    <div className="pt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
      <button type="submit" className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-indigo-800 transition w-full sm:w-auto shadow">Save Customer</button>
      <button type="reset" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition w-full sm:w-auto shadow">Reset</button>
    </div>
  </form>
);

export default CustomersFormFields;
