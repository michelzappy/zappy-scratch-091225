export const deprecationWarning = (deprecatedRoute, newRoute) => (req, res, next) => {
  console.warn(`DEPRECATED: ${req.method} ${deprecatedRoute} is deprecated. Use ${newRoute} instead.`);
  next();
};
