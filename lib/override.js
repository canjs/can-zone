module.exports = Override;

function Override(obj, name, fn) {
	this.oldValue = obj[name];
	this.obj = obj;
	this.name = name;
	this.value = fn(this.oldValue, this);
}

Override.prototype.trap = function(){
	this.obj[this.name] = this.value;
};

Override.prototype.release = function(){
	this.obj[this.name] = this.oldValue;
};
