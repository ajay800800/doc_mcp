const fs = require('fs');

exports.read = (filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
};

exports.write = (filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf-8');
};
