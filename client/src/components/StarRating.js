import React from 'react';

export default function StarRating({ rating = 0, reviewCount }) {
  const rounded = Math.round(parseFloat(rating) || 0);
  const stars = '★★★★★'.slice(0, rounded) + '☆☆☆☆☆'.slice(0, 5 - rounded);

  return (
    <div className="rating" aria-label={`Rated ${rating} out of 5`}>
      {stars}
      {typeof reviewCount === 'number' && <span className="count">({reviewCount})</span>}
    </div>
  );
}
