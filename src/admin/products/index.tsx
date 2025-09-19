import React from 'react';
import AdminHeader from '../AdminHeader';

const AdminProducts: React.FC = () => (
	<>
		<AdminHeader />
		<div style={{ padding: '2rem' }}>
			{/* Admin products content goes here */}
			<h2>Welcome to the Admin Products Dashboard</h2>
		</div>
	</>
);

export default AdminProducts;
