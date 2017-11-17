const fs = require('fs')

module.exports = function(filepath) {
  if (!fs.existsSync(filepath)) return false;

  // Returns an instance of fs.Stats 
  //https://https://nodejs.org/api/fs.html#fs_fs_statsync_path
  const stats = fs.lstatSync(filepath);
  return stats.isFile() || stats.isSymbolicLink();
}