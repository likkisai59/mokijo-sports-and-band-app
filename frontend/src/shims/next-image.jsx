import React from 'react';

export default function Image({ src, alt, width, height, className, style, priority, ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
      {...props}
    />
  );
}
