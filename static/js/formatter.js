var Formatter = function(str){
  if (!(this instanceof Formatter)) return new Formatter(str);
  this.str = str;
  this.cursor = 0;
  this.buffer = [];
  this.state = '';
  this.level = 0;
}
Formatter.prototype.eat = function() {
  var cursor = this.cursor,
      str = this.str,
      ind = Formatter.IND,
      buffer = this.buffer,
      whitespace = Formatter.whitespace;
  
  if (cursor >= str.length) { return null; }
  
  if (this.state === Formatter.QUOT) {
    switch (str[cursor]) {
      case Formatter.ESC:
      buffer.push( str[cursor] );
      if (str[cursor+1] === QUOT)
        buffer.push( str[++cursor] ); //skip one
      break;

      case Formatter.QUOT:
      this.state = Formatter.NONE;
      buffer.push( str[cursor] );
      break;
      
      default:
      buffer.push( str[cursor] );
    }
  }
  else {
    switch (str[cursor]) {
      case Formatter.OPEN:
      buffer.push( str[cursor] );
      buffer.push( whitespace(ind * (++this.level)) );
      break;

      case Formatter.CLOSE:
      buffer.push( whitespace(ind * (--this.level)) );
      buffer.push( str[cursor] );
      break;
      
      case Formatter.COMMA:
      buffer.push( str[cursor] );
      buffer.push( whitespace(ind * this.level) );
      break;

      case Formatter.QUOT:
      this.state = Formatter.QUOT;
      buffer.push( str[cursor] );
      break;

      default:
      buffer.push( str[cursor] );
    }
  }
  this.cursor +=1;
}
Formatter.prototype.format = function() {
  while(this.cursor < this.str.length) { this.eat(); }
  return this.buffer.join('');
}
Formatter.whitespace = function(num) {
  var txt = "\n"
  while (num-- > 0) { txt += " "; }
  return txt;
}
Formatter.IND = 4;
// states
Formatter.NONE = '';
Formatter.QUOT = '"';
Formatter.OPEN = '{';
Formatter.CLOSE = '}';
Formatter.ESC = '\\';
Formatter.COMMA = ',';
