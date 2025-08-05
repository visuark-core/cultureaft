

const inputClass = "input bg-white border border-yellow-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition w-full placeholder-gray-400";
const sectionClass = "bg-white/80 rounded-2xl shadow p-6 mb-6 border border-yellow-100";
const sectionHeaderClass = "flex items-center gap-2 text-xl font-bold mb-4 text-yellow-800";

const ComplianceFormFields = () => (
  <form className="space-y-8 w-full max-w-5xl mx-auto px-2 sm:px-4">
    {/* 1️⃣ Basic Compliance Information */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>1️⃣</span> Basic Compliance Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="sku" placeholder="SKU (linked to product)" />
        <input className={inputClass} name="productTitle" placeholder="Product Title" />
        <input className={inputClass} name="asin" placeholder="ASIN / Product ID" />
        <input className={inputClass} name="category" placeholder="Category / Subcategory" />
        <input className={inputClass} name="productCondition" placeholder="Product Condition (New, Used, Refurbished)" />
      </div>
    </section>

    {/* 2️⃣ Legal & Regulatory Requirements */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>2️⃣</span> Legal & Regulatory Requirements</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="countryOfOrigin" placeholder="Country of Origin (Made in…)" />
        <input className={inputClass} name="hsnCode" placeholder="HSN / Tariff Code" />
        <input className={inputClass} name="regulatoryCategory" placeholder="Regulatory Category (Electronics, Food, etc.)" />
        <input className={inputClass} name="complianceType" placeholder="Compliance Type" />
        <input className={inputClass} name="localStandards" placeholder="Local Standards (ISI, BIS, FSSAI)" />
        <input className={inputClass} name="internationalStandards" placeholder="International Standards (CE, RoHS, FCC, FDA)" />
      </div>
    </section>

    {/* 3️⃣ Certificates & Documentation */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>3️⃣</span> Certificates & Documentation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="complianceCertificates" placeholder="Compliance Certificate Uploads" type="file" multiple />
        <input className={inputClass} name="manufacturerDeclaration" placeholder="Manufacturer Declaration" type="file" />
        <input className={inputClass} name="labTestReports" placeholder="Lab Test Reports" type="file" multiple />
        <input className={inputClass} name="sds" placeholder="Safety Data Sheet (SDS)" type="file" />
        <input className={inputClass} name="importExportLicense" placeholder="Import/Export License" type="file" />
        <input className={inputClass} name="warrantyCertificates" placeholder="Warranty & Guarantee Certificates" type="file" />
        <input className={inputClass} name="environmentalCompliance" placeholder="Environmental Compliance (RoHS, WEEE, EPR)" />
      </div>
    </section>

    {/* 4️⃣ Safety & Warning Labels */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>4️⃣</span> Safety & Warning Labels</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="hazardSymbols" placeholder="Hazard Symbols (flammable, toxic, etc.)" />
        <input className={inputClass} name="ageRestriction" placeholder="Age Restriction (e.g., 3+, 18+)" />
        <input className={inputClass} name="usageWarnings" placeholder="Usage Warning Statements" />
        <input className={inputClass} name="storageConditions" placeholder="Storage Conditions" />
      </div>
    </section>

    {/* 5️⃣ Expiry & Batch Tracking */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>5️⃣</span> Expiry & Batch Tracking</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="mfgDate" placeholder="Manufacturing Date (MFG Date)" type="date" />
        <input className={inputClass} name="expiryDate" placeholder="Expiry / Best Before Date" type="date" />
        <input className={inputClass} name="batchNumber" placeholder="Batch / Lot Number" />
        <input className={inputClass} name="serialNumber" placeholder="Serial Number Tracking" />
      </div>
    </section>

    {/* 6️⃣ Marketplace Compliance Checks */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>6️⃣</span> Marketplace Compliance Checks</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="amazonGuidelines" placeholder="Amazon Category-Specific Guidelines" />
        <input className={inputClass} name="restrictedProductCheck" placeholder="Restricted Product Check (flag if prohibited)" />
        <select className={inputClass} name="complianceStatus" defaultValue="">
          <option value="" disabled>Compliance Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending Review</option>
          <option value="expired">Expired Document</option>
        </select>
        <input className={inputClass} name="documentExpiryAlert" placeholder="Document Expiry Alerts (e.g., FSSAI renewal)" type="date" />
      </div>
    </section>

    {/* 7️⃣ Advanced Features */}
    <section className={sectionClass}>
      <h3 className={sectionHeaderClass}><span>7️⃣</span> Advanced Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <input className={inputClass} name="multiCountryCompliance" placeholder="Multi-country Compliance Support (upload per country)" />
        <input className={inputClass} name="aiDocumentValidator" placeholder="AI-based Document Validator" />
        <input className={inputClass} name="complianceRiskScore" placeholder="Compliance Risk Score (low/medium/high)" />
        <input className={inputClass} name="autoSyncRegulatory" placeholder="Auto Sync with Regulatory Databases" />
      </div>
    </section>

    <div className="pt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
      <button type="submit" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-8 py-3 rounded-lg font-bold hover:from-yellow-600 hover:to-yellow-700 transition w-full sm:w-auto shadow">Save Compliance</button>
      <button type="reset" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition w-full sm:w-auto shadow">Reset</button>
    </div>
  </form>
);

export default ComplianceFormFields;
