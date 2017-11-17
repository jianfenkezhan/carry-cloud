
module.exports = isFunction = function(f){
  return Object.prototype.toString.call(f) === '[object Function]';
}
