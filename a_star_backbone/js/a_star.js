//A* Demo with a backbone

$(function(){

		require(["colorChanger","models","views"], function(){
			Backbone.sync = function(method, model, success, error){ 
				success();
			}
			var appView = new AppView();
		});

});