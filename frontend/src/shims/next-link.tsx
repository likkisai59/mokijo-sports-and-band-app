import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const Link = React.forwardRef<HTMLAnchorElement, any>(({ href, children, ...props }, ref) => {
  const to = href || '#';
  if (typeof to === 'string' && (to.startsWith('http://') || to.startsWith('https://') || to.startsWith('mailto:') || to.startsWith('tel:'))) {
    return (
      <a href={to} ref={ref} {...props}>
        {children}
      </a>
    );
  }
  return (
    <RouterLink to={to} ref={ref} {...props}>
      {children}
    </RouterLink>
  );
});

Link.displayName = 'Link';
export default Link;
