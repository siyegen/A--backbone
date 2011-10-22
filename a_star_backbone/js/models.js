//Models/collections

var CellState = {
	blank: 'blank',
	selected: 'selected',
	travelled: 'travelled',
	path: 'path',
	start: 'start',
	end: 'end'
};

var Cell = Backbone.Model.extend({
	defaults: {
		state: CellState.blank,
		lastState: null,
		moveCost: 1,
	},
	changeState: function(newState){
		var oldState = this.get('state');
		if(oldState!==newState){
			if((oldState===CellState.end || oldState===CellState.start) 
				&& (newState===CellState.travelled || newState===CellState.path)){
				return;
			}
			var states = {
				lastState : this.get('state'),
				state: newState
			};
			this.set(states);
		}
		return this;
	}
});

var CellList = Backbone.Collection.extend({
	model: Cell
});

var Grid = Backbone.Model.extend({
	defaults: {
		columns : 5, rows: 5, moving: false
	},
	initialize: function(){
		var l_cols = this.get('columns');
		var l_rows = this.get('rows');
		console.log('Init Grid -> '+l_rows+' x '+l_cols);
		this.collection = new CellList();
		this.size = l_cols * l_rows;
		for(var i=0, x=0, y=0; i<this.size; i++){
			var cell = new Cell();
			var values = {
				x: x, y: y, id: 'c-'+x+'-'+y
			};
			if(i%l_cols === (l_cols-1)){
				y=0;
				x++;
			} else {
				y++;
			}
			cell.set(values);
			this.collection.add(cell);
		}
		return this;
	},
	getAdjCells: function(cell){
		var cells = [];
		var ids = [];
		var xId = cell.get('x');
		var yId = cell.get('y');
		ids.push({x: xId-1, y: yId});
		ids.push({x: xId, y: yId+1});
		ids.push({x: xId+1, y: yId});
		ids.push({x: xId, y: yId-1});

		for(var i=0; i<4; i++){
			var element = this.collection.get('c-'+ids[i].x+'-'+ids[i].y);
			if(element!==undefined){
				cells.push(element);
			}
		}
		return cells;
	}
});