Simple project for A* pathfinding in a browser

Uses backbone.js and jquery for model/rendering

A* demo with a backbone.  Input the number of rows and columns in the range [2, 20].

Click 'Build' to build the grid.  Click and drag the start/end (green/red) cells to move them.
Click and drag any other cell to toggle whether it's passable or not.

When you're ready, click 'Start' to let the algo try to find a path.  The path is shown in light
blue, and expanded (or travelled) cells are shown in a varying color depending on the cost g(n) to get
there from the start cell.  If you want to make changes to the grid and try again click 'Unlock', 
make your changes, and then click 'Start' again.  Clicking 'Build' again will reset the grid.  Be
warned that resizing the window so that the grid changes size will cause the inputs to be off untill
you rebuild.