export const formatImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const apiBase = import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
};
