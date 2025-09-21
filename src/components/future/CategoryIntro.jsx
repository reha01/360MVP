// src/components/CategoryIntro.jsx
import React from 'react';

const CategoryIntro = ({ category }) => {
  return (
    <div>
      <h3>{category?.title}</h3>
      <p>{category?.description}</p>
    </div>
  );
};

export default CategoryIntro;
