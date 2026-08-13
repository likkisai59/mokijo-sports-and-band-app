import { useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams as useRouterSearchParams, useParams as useRouterParams } from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(() => ({
    push: (url) => navigate(url),
    replace: (url) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    prefetch: () => {},
    refresh: () => window.location.reload(),
  }), [navigate]);
}

export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

export function useSearchParams() {
  const [searchParams] = useRouterSearchParams();
  return searchParams;
}

export function useParams() {
  return useRouterParams();
}

export function redirect(url) {
  window.location.href = url;
  throw new Error(`Redirecting to ${url}`);
}
