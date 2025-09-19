import React from 'react';

const AdminHeader: React.FC = () => (
  <header style={{ background: '#1e293b', color: '#fff', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Admin Dashboard</h1>
    <nav>
      <a href="/admin/products" style={{ color: '#fff', marginRight: '1.5rem', textDecoration: 'none' }}>Products</a>
      <a href="/admin/analytics" style={{ color: '#fff', marginRight: '1.5rem', textDecoration: 'none' }}>Analytics</a>
      <a href="/admin/settings" style={{ color: '#fff', textDecoration: 'none' }}>Settings</a>
    </nav>
  </header>
);

export default AdminHeader;
