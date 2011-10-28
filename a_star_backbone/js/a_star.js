//A* Demo with a backbone

$(function(){

		require(["hashmap","binheap","colorChanger","models","views"], function(){
			Backbone.sync = function(method, model, success, error){ 
				success();
			}
			var appView = new AppView();
		});

});