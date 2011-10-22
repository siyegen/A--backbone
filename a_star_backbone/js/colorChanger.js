function ColorChanger(startColor, endColor, step){
	this.startColor = startColor;
	this.endColor = endColor;
	this.step = [step];
	this.steps = [];
	this.init();
};

ColorChanger.prototype = {
	init: function(){
		this.steps[0] = Math.floor((this.endColor[0] 
			- this.startColor[0])/this.step);
		this.steps[1] = Math.floor((this.endColor[1] 
			- this.startColor[1])/this.step);
		this.steps[2] = Math.floor((this.endColor[2] 
			- this.startColor[2])/this.step);
	},
	incrementAll: function(allColors, value){
		allColors[0] = this.increment(allColors[0], 
			0, value);
		allColors[1] = this.increment(allColors[1], 
			1, value);
		allColors[2] = this.increment(allColors[2], 
			2, value);
		return allColors;		
	},
	increment: function(color, which, value){
		return color + (value * this.steps[which]);
	}
}