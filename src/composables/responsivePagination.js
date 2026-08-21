const MOBILE_PAGE_QUERY = '(max-width: 768px)'

export function getResponsivePageSize() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 10
  return window.matchMedia(MOBILE_PAGE_QUERY).matches ? 5 : 10
}
