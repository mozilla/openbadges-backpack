var fs = require('fs')
  , util = require('./lib/util.js')

// ByteArray is a janky implementation of array that allows me to pretend I
// have a typed array. It can turn four bytes into an unsigned 32 bit integer
// (big-endian). Once a stable version of node comes out with typed arrays,
// replace this with that.
var ByteArray = function(bytes){
  if (!(this instanceof ByteArray)) return new ByteArray(bytes);
  if (bytes) { this.pushBytes(bytes); }
}
ByteArray.prototype = new Array;
ByteArray.prototype.is = function(otherArray){
  for (var i = otherArray.length; i > 0; --i)
    if (otherArray[i] !== this[i]) return false;
  return true;
}
ByteArray.prototype.to32Int = function() {
  var x = 3, sum = 0, i = 0;
  for (; i <= x; i++)
    sum += Math.pow(256, (x-i)) * this[i];
  return sum;
}
ByteArray.prototype.pushBytes = function(bytes) {
  Array.prototype.push.apply(this, Array.prototype.slice.call(Buffer(bytes)));
  return this;
}

const PNG_MAGIC_NUMBER = ByteArray([137, 80, 78, 71, 13, 10, 26, 10]);

// An interface for reading chunks from a PNG. `source` can be a buffer, file
// descriptor or a string containing the path to a file.
var Reader = function(source) {
  if (!(this instanceof Reader)) return new Reader(source);
  this.source = source;
  this.data = null;
  this.cursor = 0;
  this.chunks = null;
}
Reader.prototype.getContents = function() {
  var source = this.source
    , len = null
    , buf = null
  if (Buffer.isBuffer(source))
    return this.data = source;
  else if ('number' === typeof source) {
    len = fs.fstatSync(source).size
    buf = Buffer(len);
    fs.readSync(source, buf, 0, len);
    return this.data = buf;
  }
  else if ('string' === typeof source) {
    return this.data = fs.readFileSync(source);
  }
  throw "unrecognized source. must be filename, file descriptor or buffer";
}
Reader.prototype.rewind = function(len){
  if (!len) this.cursor = 0;
  else { this.cursor -= len }
  if (this.cursor < 0) this.cursor = 0;;
}
Reader.prototype.eat = function(len) {
  var buf = this.peek(len);
  this.cursor += len;
  return buf;
}
Reader.prototype.peek = function(len) {
  if (!this.data) this.getContents();
  return this.data.slice(this.cursor, (this.cursor + len));
}

// Ensures that the buffer being read is a PNG by comparing it to the known
// PNG magic number, then read all of the chunks in the file to an array
// `this.chunks`.
Reader.prototype.readChunks = function() {
  var magic_nom_nom
    , chunk;
  this.chunks = [];
  this.rewind();
  magic_nom_nom = this.eat(8)
  if (!PNG_MAGIC_NUMBER.is(magic_nom_nom)) throw "this is not a PNG";
  while (chunk = this.readNextChunk()) this.chunks.push(chunk)
  return this.chunks;
}
// Generally this should not be called by itself, `this.readChunks` should be
// used. If `this.cursor` is not at a chunk boundary, this should probably cause
// an error. Otherwise there's a chance that this can silently return garbage data.
Reader.prototype.readNextChunk = function() {
  if (this.cursor === this.data.length) return null;
  var start = this.cursor
    , len = ByteArray(this.eat(4)).to32Int()
    , type = this.eat(4).toString()
    , data = this.eat(len)
    , crc = this.eat(4)
    , end = this.cursor
  return {start: start, len: len, type: type, data: data, crc: crc, end: end}
}
// Get an array of chunks that match the type. Possible types are listed here:
// http://www.w3.org/TR/PNG/#11Chunks. Order is determined by where the chunks
// appear in the file, and the return type will always be an array (even if
// the specification only allows one one instance of that type)
Reader.prototype.findByType = function(type) {
  if (!this.chunks) this.readChunks()
  return this.chunks.filter(function(chunk){
    return (chunk.type === type);
  });
}


// Writer is an interface for inserting chunks into a PNG. Other than
// generating a valid, CRCd chunk, there is no validation to speak of. Using this
// to add types with invalid data can break your PNG.
//
// Using pushBytes in this way causes five new buffers to be created. This can
// definitely be done more efficiently.
function Writer(source) {
  if (!(this instanceof Writer)) return new Writer(source);
  Reader.call(this, source)
}
Writer.prototype = new Reader;
Writer.prototype.chunk = function(type, data) {
  var body = ByteArray()
    , chunk = ByteArray()
  body
    .pushBytes(type)
    .pushBytes(data);
  chunk
    .pushBytes(util.intToBytes(data.length))
    .pushBytes(body)
    .pushBytes(util.intToBytes(util.crc32(body)));

  return Buffer(chunk);
}

// The specification for tEXt chunks requires a keyword and data, separated by
// a null character, for the body of the chunk.
Writer.prototype.tEXt = function(keyword, data) {
  return this.chunk('tEXt', [keyword, data].join("\u0000"));
}

// Expose objects as well as shortcut methods for reading and writing tEXt chunks.
exports.Reader = Reader;
exports.Writer = Writer;
exports.read = function(src, key){
  var textChunks = Reader(src).findByType('tEXt');
  return textChunks;
};
exports.write = function(src, key, data) {
  var writer = Writer(src)
    , ihdr_end = writer.findByType('IHDR').pop().end
    , chunk = writer.tEXt(key, data)
    , len = writer.data.length + chunk.length
    , buf = Buffer(len)
  writer.data.copy(buf, 0, 0, ihdr_end);
  chunk.copy(buf, ihdr_end)
  writer.data.copy(buf, (ihdr_end + chunk.length), ihdr_end)
  return buf;
}
