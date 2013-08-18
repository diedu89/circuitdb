// hashtable for storing the grid nodes
// this avoid to use unnecesary node of the graphic grid
var grid = {};

function findPath(from, to){
	var openList = {};
	var closeList = {};
	var parent={};
	var path="";
	
	endNode = getNode({position:to});

	parent = getNode({position: from, endPoint: endNode});
	parent.g = 0;
	parent.f = parent.g + parent.h;
	parent.parent = null;

	grid[parent.hash].state = 1;
	closeList[parent.hash] = parent;

	var i=0,j;
	var tempNode;
	var index;

	// do while the endpoint is no reached
	main_loop:
	while(parent.hash != to.hash)
	{
		for(index in parent.neighbors)
		{
			tempNode = getNode({position: parent.neighbors[index], endPoint: endNode});
			
			if(!!closeList[tempNode.hash] || tempNode.state ==1) continue;

			if(!openList[tempNode.hash]){
				tempNode.g = parent.g + 10;
				tempNode.parent = parent;
			}else{
				tempNode = openList[tempNode.hash];
				if(tempNode.g > parent.g + 10){
					tempNode.g = parent.g+10;
					tempNode.parent = parent;
				}
			}

			if(tempNode.h==0){
				parent = tempNode;
				break main_loop;
			}

			tempNode.f = tempNode.g + tempNode.h;
			openList[tempNode.hash] = tempNode;

			/*connectorsLayer.add(new Kinetic.Circle({
				x: tempNode.x - 1.5,
				y: tempNode.y - 1.5,
				fill: 'red',
				stroke: 'black',
				strokeWidth: 1,
				radius: 2
			}));*/
		}
		
		tempNode = undefined;
		for(index in openList)
		{
			tempNode = tempNode || openList[index];
			if(tempNode.f > openList[index].f) tempNode = openList[index];
		}

		if(tempNode == undefined) return "";

		delete openList[tempNode.hash];
		closeList[tempNode.hash] = tempNode;

		/*connectorsLayer.add(new Kinetic.Circle({
			x: tempNode.x - 1.5,
			y: tempNode.y - 1.5,
			fill: 'green',
			stroke: 'black',
			strokeWidth: 1,
			radius: 2
		}));*/

		parent = tempNode;
	}

	for(index in openList)
		connectorsLayer.add(new Kinetic.Circle({
			x: openList[index].x,
			y: openList[index].y,
			fill: 'green',
			stroke: 'black',
			strokeWidth: 1,
			radius: 2
		}));

	for(index in closeList)
		connectorsLayer.add(new Kinetic.Circle({
			x: closeList[index].x - 1,
			y: closeList[index].y - 1,
			fill: '#5395ee',
			stroke: 'black',
			strokeWidth: 1,
			radius: 2
		}));

	connectorsLayer.draw();

	i=0;
	path = "M" + parent.x + ","+ parent.y + "L" + parent.x + ", "+ parent.y +" ";
	do{
		i++
		grid[parent.hash].state=1;
		parent = parent.parent;
		path = path +"L"+ parent.x + "," + parent.y + " ";
	}while(parent.parent != null && i<1000)
	
	//path = path.replace(/^\s+|\s+$/g, '');
	//connectorsLayer.draw();
	return path;
}

function getNode(data){
	var hash = data.position.hash || data.position;
	var pos_x=data.position.x || parseInt(data.position.slice(0,3)); 
	var pos_y=data.position.y || parseInt(data.position.slice(-3));
	if(grid[hash] != undefined)
		return grid[hash];

	var new_node = {
		hash: hash,
		x:pos_x,
		y:pos_y,
		f:0,
		g:0,
		h:((!!data.endPoint)?(Math.abs(pos_x - data.endPoint.x) + Math.abs(pos_y - data.endPoint.y)):0),
		parent: null,
		neighbors: {},
		state: 0
	}

	//console.log(data.position.x || );

	if(new_node.x - 10 > 0)
		new_node.neighbors["left"] = ("00" + (new_node.x - 10)).slice(-3) + hash.slice(-3);

	if(new_node.x + 10 < S_WIDTH)
		new_node.neighbors["right"] = ("00" + (new_node.x + 10)).slice(-3) + hash.slice(-3);		

	if(new_node.y - 10 > 0)
		new_node.neighbors["up"] = hash.slice(0,3) + ("00" + (new_node.y - 10)).slice(-3);

	if(new_node.y + 10 < S_HEIGHT)
		new_node.neighbors["down"] = hash.slice(0,3) + ("00" + (new_node.y + 10)).slice(-3);

	grid[hash] = new_node;

	return new_node;
}