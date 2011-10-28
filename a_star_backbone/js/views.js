// Views for the Demo
// CellView is the view for rendering each of the 'cells'
// current a td element in a row for ease of use

var CellView = Backbone.View.extend({
	tagName: 'td',
	className: 'cell',
	// Base Cellcolor Array, r=0, g=1, b=2
	cellColor: [255,204,0],
	initialize: function(){
		_.bindAll(this, 'render', 'handleClick', 'changeBinding', 'incrementColor', 'cellInfo', 'toggle');

		this.model.bind('change', this.render);
		this.model.bind('change', this.changeBinding);
	},
	events: {
		'mousedown': 'handleClick'
	},
	changeBinding: function(){
		if(this.model.get('binding')==='remove'){
			this.delegateEvents({});
		} else if(this.model.get('binding')==='reset'){
			this.delegateEvents(this.events);
		}
	},
	render: function(){
		$(this.el).attr('id', this.model.id);
		var lastState = this.model.get('lastState');
		var currState = this.model.get('state');
		if(lastState!==currState){
			$(this.el).removeClass(lastState);
			$(this.el).addClass(currState);
			if(currState===CellState.travelled){
				var newColors = this.incrementColor(this.model);
				$(this.el).css({'background-color': 'rgb('+newColors.join(',')+')'});
			} else {
				$(this.el).css({'background-color': ''});
			}
		}
		return this;
	},
	incrementColor: function(cell){
		// r=0, g=1, b=2
		return this.colorChanger.incrementAll(this.cellColor.slice(0), cell.get('gCost'));
	},
	handleClick: function(e){
		e.preventDefault();
		if(e.which===1){
			if(e.ctrlKey === true){
				this.cellInfo(e);				
			} else {
				this.toggle(e);				
			}
		}
	},
	toggle: function(e){ // Cell toggling is only for blank to selected or vice-versa
		if(this.model.get('state')===CellState.blank){
			this.model.changeState(CellState.selected);
		} else if(this.model.get('state')===CellState.selected){
			this.model.changeState(CellState.blank);
		}
	},
	// Creates a CellInfoView with this model as the model
	// Used to render the floating divs that contain the information on the cell
	cellInfo: function(e){ 
		if(this.model.get('hasInfo')!==true){
			console.log(this.model);
			var infoView = new CellInfoView({
				model: this.model,
				position: {x: e.pageX, y: e.pageY}
			});
			$('body').append(infoView.render().el);
		}
	}
});

// View used to render the moving cell for start/end
// We pass it a new cell as the model, so we can update 
// the view based on the model attr changing
// When the model is set to 'kill', we destory the model
// and remove the view from the scene
var MoveCellView = Backbone.View.extend({
	tagName: 'div',
	className: 'cell-move',
	cellWidth: null,
	cellHeight: null,
	initialize: function(options){
		_.bindAll(this, 'render', 'remove');

		this.model.bind('change', this.render);
		this.cellWidth = options.cellWidth;
		this.cellHeight = options.cellHeight;
	},
	events: {
		'mouseup': 'remove'
	},
	render: function(){
		if(this.model.get('kill')===true){
			this.model.destroy();
			$(this.el).remove();
		}
		$(this.el).css({
			'left': (this.model.get('x') - (this.cellWidth / 2)),
			'top': (this.model.get('y') - (this.cellHeight / 2))
		}).addClass(this.model.get('state'));
		return this;
	},
	remove: function(){
		this.model.set({kill: true});
	}
});

// This view is responsible for the Grid
// As the higher up view it contains a collection of cells
// And will change the state of the cells which will 
// cause updates/re-rendering of the CellView
var GridView = Backbone.View.extend({
	tagName: 'div',
	className: 'grid-view',
	template: _.template($('#grid-template').html()),
	lastCell: null, // used for dragging start/end points
	cellWidth: null,
	cellHeight: null,
	offsetX: 0,
	offsetY: 0,
	selectState: CellState.blank, // same states as cell
	moveCell: null, // cell we are moving, created/destroyed as needed
	startCell: null,
	endCell: null,
	initialize: function(){
		_.bindAll(this, 'render', 'createCells', 'drag', 'setMove', 'removeMove', 'pluckCell', 'rebind', 'unbindAll');

	},
	events: {
		'mousemove': 'drag',
		'mousedown .grid': 'setMove',
		'mouseup': 'removeMove',
		'mouseleave': 'removeMove'
	},
	// this function will rebind all of the events in the events hash
	// it also trickles down and resets the path/travelled cells
	rebind: function(){
		this.delegateEvents(this.events);				
		this.model.collection.each(function(cell){
			var currState = cell.get('state');
			if(currState === CellState.path || currState === CellState.travelled){
				currState = CellState.blank;
			}
			cell.changeState(currState);
			cell.set({binding: 'reset'});
		});
	},
	// Removes all event bindings
	// Assures the same is done for the cells
	unbindAll: function(){
		this.delegateEvents({});
		this.model.collection.each(function(cell){
			cell.set({binding: 'remove'});
		});
	},
	render: function(){
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	},
	// Function called after init to create all the cells in the Grid
	createCells: function(){
		CellView.prototype.colorChanger = new ColorChanger([255,245,8], [127,100,93], 
			Math.max(this.model.get('rows'), this.model.get('columns')));

		var offSet = this.$('.grid').offset();
		this.offsetX = offSet.left;
		this.offsetY = offSet.top;

		this.model.collection.each(function(cell){
			var cellView = new CellView({
				model: cell,
				id: 'c-'+cell.get('x')+'_'+cell.get('y')
			});
			this.$('#row-'+cell.get('x')).append(cellView.render().el);
		});

		this.cellWidth = $('#'+this.model.collection.first().id).outerWidth();
		this.cellHeight = $('#'+this.model.collection.first().id).outerHeight();

		this.startCell = this.model.collection.get('c-0-0').changeState(CellState.start);
		this.endCell = this.model.collection.get(
			'c-'+(this.model.get('rows')-1)+'-'+(this.model.get('columns')-1))
			.changeState(CellState.end);
		return this;
	},
	drag: function(e){
		e.preventDefault();
		if(this.model.get('moving')===true){
			var cell = this.pluckCell(e.pageX, e.pageY);
			if(cell !== undefined){	
				var currCellState = cell.get('state');
				if(this.selectState === CellState.start || this.selectState === CellState.end){
					if(this.moveCell !== null){
						this.moveCell.set({x: e.pageX, y: e.pageY});
					}
				} else if (this.selectState === CellState.blank 
					|| this.selectState === CellState.selected){
					if(currCellState !== CellState.start 
						&& currCellState !== CellState.end){
						cell.changeState(this.selectState);	
					}		
				}
			}
		}				
	},
	setMove: function(e){
		e.preventDefault();
		if(e.which===1){
			this.model.set({moving: true});
			var cell = this.pluckCell(e.pageX, e.pageY);
			if(cell !== undefined){
				this.selectState = cell.get('state');
				this.lastCell = cell;
				if(this.selectState === CellState.start || this.selectState === CellState.end){
					this.moveCell = new Cell({x: e.pageX, y: e.pageY, state: this.selectState});
					var movingCellView = new MoveCellView({
						model: this.moveCell,
						cellWidth: this.cellWidth,
						cellHeight: this.cellHeight
					});
					this.lastCell.changeState(CellState.blank);
					$('.grid-view').append(movingCellView.render().el);
				}
			}
		}
	},
	removeMove: function(e){
		e.preventDefault();
		this.model.set({moving: false});
		if(this.moveCell !== null){
			var crrCell = this.pluckCell(e.pageX, e.pageY);
			if(crrCell!==undefined){
				if(crrCell.get('state')===CellState.start || crrCell.get('state')===CellState.end){
					this.lastCell.changeState(this.selectState);
				} else {
					if(this.selectState===CellState.start){
						this.startCell = crrCell;
					} else if(this.selectState===CellState.end){
						this.endCell = crrCell;
					}
					crrCell.changeState(this.selectState);
				}
			} else {
				this.lastCell.changeState(this.selectState);
				this.moveCell.set({kill: true});
			}
			this.moveCell = null;
		}
		this.selectState = CellState.blank;
		this.lastCell = null;

	},
	pluckCell: function(x, y){
		var cellId = "c-"+Math.floor((y-this.offsetY)/this.cellHeight)+
			"-"+Math.floor((x-this.offsetX)/this.cellWidth);
		return this.model.collection.get(cellId);			
	},
	h: function(cell){ // h(n)
		var value = cell.get('moveCost') * (Math.abs(cell.get('x')-this.endCell.get('x')) 
			+ Math.abs(cell.get('y')-this.endCell.get('y')));
		return value;
	},
	g: function(cell){ // g(n)
		if(cell===this.startCell){
			return 0;
		} else return cell.get('parent').get('gCost') + cell.get('moveCost');
	},
	moveCost: function(from, to){
		var value = to.get('moveCost') * (Math.abs(to.get('x')-from.get('x')) 
			+ Math.abs(to.get('y')-from.get('y')));
		return value;
	},
	buildPath: function(cell){
		while(cell!=this.startCell){
			cell.changeState(CellState.path);
			cell = cell.get('parent');
		}
	}
});

var InputView = Backbone.View.extend({
	tagName: 'input',
	className: 'numbers',
	initialize: function(){
		_.bindAll(this, 'render', 'inputNumber', 'getValue');
		$(this.el).val(5);
	},
	events: {
		'keydown': 'inputNumber'
	},
	render: function(){
		$(this.el).attr({'id': this.id});
		return this;				
	},
	inputNumber: function(e){
		var key_code = e.which;
		if(typeof key_code === 'undefined'){
			return;
		} else if(key_code === 9 || key_code === 8 || 
    		key_code === 46 || (key_code < 58 && key_code > 47) || (key_code < 106 && key_code > 95)){
    			
    	} else {
    		event.preventDefault();
		}
	},
	getValue: function(){
		return $(this.el).val();
	}
});

var CellInfoView = Backbone.View.extend({
	tagName: 'div',
	className: 'cell-info',
	initialize: function(pos){
		_.bindAll(this, 'render', 'close');
		this.x = pos.position.x;
		this.y = pos.position.y;		
	},
	events: {
		'click .close': 'close'
	},
	render: function(){
		this.model.set({hasInfo: true});
		var info = this.model.get('state') + ' - ' + this.model.get('gCost');
		var box = this.make('div', {class: ''}, info);
		var close = this.make('div', {class: 'close'}, 'X');
		$(this.el).append(box).append(close);
		$(this.el).css({top: this.y, left: this.x});
		return this;		
	},
	close: function(e){
		e.preventDefault();
		e.stopPropagation();
		if(e.which===1){
			this.model.set({hasInfo: false});
			$(this.el).remove();
		}
	}
});

var AppView = Backbone.View.extend({
	el: $('body'),
	gridView: null,
	initialize: function(){
		_.bindAll(this, 'render', 'buildGrid', 'findPath', 'lock', 'unlock');
		this.render();
	},
	events: {
		'click button#buildGrid': 'buildGrid',
		'click button#findPath': 'findPath',
		'click button#unlock': 'unlock'
	},
	render: function(){
		$(this.el).append($('<div>').addClass('astarapp'));
		this.rowView = new InputView({id: 'gridRows'});
		this.colView = new InputView({id: 'colRows'});
		var buttonTemplate = _.template($('#button-template').html());
		$(this.el).append($('<div>').append(this.rowView.render().el).append(this.colView.render().el));
		$(this.el).append(buttonTemplate({id: 'buildGrid', name: 'Build'}));
		$(this.el).append(buttonTemplate({id: 'findPath', name: 'Start'}));
		$(this.el).append(buttonTemplate({id: 'unlock', name: 'Unlock'}));

		$(this.el).append($('<div>').addClass('info-box'));
		var helpInfo = this.make('div', {class: 'info'}, $('#help-text').html());
		this.$('.info-box').append(helpInfo);
	},
	buildGrid: function(){
		var cols = this.colView.getValue(),
		rows = this.rowView.getValue();
		if(cols < 2 || rows < 2 || cols > 20 || rows > 20){
			cols = 5;
			rows = 5;
		}
		if(this.gridView!==null){
			this.gridView.model.destroy();
			this.gridView.remove();
		}
		var grid = new Grid({columns: cols, rows: rows});
		this.gridView = new GridView({
			model: grid
		});
		this.$('.astarapp').html(this.gridView.render().el);
		this.gridView.createCells();
	},
	lock: function(){
		this.gridView.unbindAll();
	},
	unlock: function(){
		this.gridView.rebind();	
	},
	findPath: function(){
		// locks the events from firing on the grid
		this.lock();
		var grid = this.gridView.model;
		var currGridView = this.gridView;
		var closed = new Hash();
		var openList = new Hash();
		var open = new BinHeap(function(e){
			return e.get('fCost');
		}, 'min');

		var currentCell = null;
		var start = currGridView.startCell;
		var end = currGridView.endCell;

		start.set({gCost: 0});
		open.push(start);
		openList.put(start.id, start);

		// While we have some elements that have to be looked at
		while(open.size()>0){
			// Open is a binheap that uses the fCost of each cell
			// pop will always return the lowest cell with the lowest fCost
			currentCell = open.pop();
			openList.remove(currentCell.id);
			// popping the end cell means we've found our lowest cost path
			if(currentCell===end){
				currGridView.buildPath(currentCell);
				break;
			}
			// The closed list is a list of cells we no longer wish to look at
			closed.put(currentCell.id, currentCell);
			// for each adjacent cell to the current cell, look at it and determine
			// the costs of moving to it and the cost of getting to the end from there
			_.each(grid.getAdjCells(currentCell), function(adjCell){
				if(adjCell.get('state')!==CellState.selected){
					var cost = currGridView.g(currentCell) + currGridView.moveCost(currentCell, adjCell);
					if(openList.contains(adjCell.id) && cost < openList.get(adjCell.id).get('gCost')){
						adjCell.set({parent: currentCell, silent: true});
						open.remove(adjCell);
						openList.remove(adjCell.id);
					}
					if(closed.contains(adjCell.id) && cost < adjCell.get('gCost')){
						closed.remove(adjCell.id);
					}
					if(!openList.contains(adjCell.id) && !closed.contains(adjCell.id)){
						adjCell.set({parent: currentCell, silent: true});
						var setValues = {
							gCost: cost,
							fCost: currGridView.g(adjCell) + currGridView.h(adjCell),
							silent: true
						};
						adjCell.set(setValues);
						adjCell.changeState(CellState.travelled);
						open.push(adjCell);
						openList.put(adjCell.id, adjCell);
					}
				}
			});
		}
	}
});