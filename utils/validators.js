exports.isValidName = (name) => {
  return /^[a-zA-Z0-9_-]+$/.test(name);
};
