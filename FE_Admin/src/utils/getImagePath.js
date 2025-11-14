export const getImagePath = (path) => {
  if (!path) return "/images/dt1.jpg"; 
  return path.startsWith("images/") ? `/${path}` : `/images/${path}`;
};
