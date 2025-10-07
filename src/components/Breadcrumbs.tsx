import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <div className="bg-gray-100 p-4">
      <Link to="/" className="text-blue-500 hover:text-blue-700">
        Home
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        return (
          <span key={name}>
            <span className="mx-2">/</span>
            {isLast ? (
              <span className="text-gray-500">{name}</span>
            ) : (
              <Link to={routeTo} className="text-blue-500 hover:text-blue-700">
                {name}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default Breadcrumbs;