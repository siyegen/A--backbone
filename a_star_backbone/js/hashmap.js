function HashMap(keyType){
	this.data = [];	
	this.keyType = keyType;
}

HashMap.prototype = {
	put: function(key, value){
		if((typeof key) !== this.keyType){
			throw new Error("key must of type: " + this.keyType);
		}
		var hash = this.hash(key);

		if(({}).hasOwnProperty.call(this, hash)){
			this[hash].value = value;
		} else {
			var item = {key: key, value: value};
			this[hash] = item;
			// this.data.push(item);
		}
	},
	get: function(key){
		var item = this[this.hash(key)];
		return item === undefined ? undefined : item.value;
	},
	contains: function(key){
		var item = this.get(key);
		if(item===undefined){
			return false;
		} else return true;
	},
	remove: function(key){
		var item = this.get(key);
		if(item!==undefined){
			delete this[this.hash(key)];
		}
		return item;
	},
	hash: function(element){
		if(this.keyType === "object"){
			if(({}).hasOwnProperty.call(element, '__hashCode')){
				return element.__hashCode();	
			} else {
				throw new Error("Object must implement __hashCode");
			}
		} else {
			return this.keyType+": "+element.toString();
		}
	}
};