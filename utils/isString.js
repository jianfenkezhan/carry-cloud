module.exports = isString = function(str){
  return Object.prototype.toString.call(str) === '[object String]';
}