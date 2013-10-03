var shapesPath = {
	circle:" M0,30 C0,3 40,3 40,30 C40,58 0,58 0,30", 
	arrow: " M20,42 L20,23 M18,22 L 22,22 L20,19 Z",
	connectors: " M20,0 L20,10 M20,50 L20,60",
	signs: " M20,17 L20,25 M16,21 L24,21 M 16,41 L 24,41",
	rhomb: " M0,30 L20,10 L40,30 L20,50 Z",
	resistor: "M10,0 L10,7 L5,10 L15,15 L5,20 L15,25 L5,30 L15,35 L5,40 L15,45 L5,50 L10,55 L10,60"
};

var symbols= {
	R: shapesPath.resistor,
	VS: shapesPath.circle + shapesPath.signs + shapesPath.connectors,
	CS: shapesPath.circle + shapesPath.arrow + shapesPath.connectors,
	VSC: shapesPath.rhomb + shapesPath.signs + shapesPath.connectors,
	CSC: shapesPath.rhomb + shapesPath.arrow + shapesPath.connectors
}

var S_WIDTH=800, S_HEIGHT=600;

var stage, gridLayer, elementsLayer, connectorsLayer;
var drawNodes= new Object();
var elements = new Array();

var cursor;
var showCursor=false;
var md_action=null;

var rotation=0;

var path={};

var md_handlers={
	//placeElemnt
	0: placeElement
}

function mousedown_h(){
	console.log("llamada a mousedown " + md_action);
	if(md_action==null) return;

	md_handlers[md_action]();
}

function selectElement(){
	shortcut.remove('r');
	shortcut.add('r',function(){
		cursor.rotateDeg(90);
		cursor.getParent().draw();
	});

	$("#drawing_area").css("cursor","default	");

	cursor=elements[$(this).data("index")]; 
	cursor.setRotationDeg(0);
	
	showCursor = true;
	md_action = 0;
}

function moveActions(){
	if(showCursor){
		var event = stage.getPointerPosition();
		cursor.setPosition({x:event.x, y:event.y});
		cursor.draw();
		elementsLayer.draw();
	}
}

function showElement(){
	if(!showCursor) return;

	cursor.show();
	elementsLayer.draw();
}

function hideElement(){
	if(!showCursor) return;

	cursor.hide();
	elementsLayer.draw();
}

function loadCursors(){
	var tkGroup;
	var tkPath; 
	var tkCirclePositive, tkCircleNegative, tkConnectorPositive, tkConnectorNegative;
	var grpWidth, grpHeight = 60;

	for(letter in symbols){

		tkGroup = new Kinetic.Group();
		grpWidth = (letter=="R")?20:40;
		tkGroup.setWidth(grpWidth);
		tkGroup.setHeight(grpHeight);

		tkPath=new Kinetic.Path({
			data: symbols[letter],
			stroke: 'black',
			strokeWidth: 1.5
		});

		tkCirclePositive = new Kinetic.Circle({
			radius:3,
			strokeWidth:1,
			fill:'gray', 
			stroke:'black',
			x: grpWidth/2,
			y: 0,
			name: "positiveNode"
		}).hide();

		tkCircleNegative = tkCirclePositive.clone();
		tkCircleNegative.setName('negativeNode');
		tkCircleNegative.setY(grpHeight);

		tkConnectorPositive = new Kinetic.Rect({
			x: (letter=="R")?0:10,
			y: 0,
			width: 20,
			height: 10
		});

		tkConnectorNegative = tkConnectorPositive.clone();
		tkConnectorNegative.setY(grpHeight - 10);

		tkConnectorPositive.setAttr("point", "positiveNode");
		tkConnectorPositive.setName('positiveConnector');
		tkConnectorNegative.setAttr("point", "negativeNode");
		tkConnectorNegative.setName('negativeConnector');

		tkConnectorPositive.on('click', connectorsClick);
		tkConnectorNegative.on('click', connectorsClick);


		// rect add to facilitate click selection
		tkGroup.add(new Kinetic.Rect({ x:0, y:0, height:grpHeight, width:grpWidth}));
		tkGroup.add(tkPath);
		tkGroup.add(tkCirclePositive);
		tkGroup.add(tkCircleNegative);
		tkGroup.add(tkConnectorPositive);
		tkGroup.add(tkConnectorNegative);

		tkGroup.setOffset(grpWidth/2, grpHeight/2)
		tkGroup.hide();

		elements[letter]=tkGroup;

		elementsLayer.add(elements[letter]);
	}
}

function connectorsClick()
{
	var connectorType = this.getAttr('point');
	this.getParent().getChildren().each(function(shape)
		{
			if(shape.getName() == connectorType)
			{
				shape.setAttr('fill', 'blue');
				if(path.start != undefined) 
					path.end = shape.getAbsolutePosition();
				else
					path.start = shape.getAbsolutePosition();

				console.log(path);
			}
		});

	connectorsLayer.removeChildren();
	connectorsLayer.draw();
	elementsLayer.draw();

	if(path.start == path.end){
		console.log("son iguales");
		delete path.end;
		return;
	}

	if(path.start != undefined && path.end != undefined)
	{
		var pathString;
		
		elementsLayer.draw();
			
		pathString = findPath(getPosition(path.start), getPosition(path.end));
		
		if(pathString.length > 0){
			elementsLayer.add(new Kinetic.Path({
			    	x: 0,
		    	    y: 0,
			        data: pathString,
			        strokeWidth: 2,
		        	stroke: 'black'
		    	})
		    );

			elementsLayer.draw();
		}

		delete path.start;
		delete path.end;
	}
}

function showConnectors(){
	stage.get('.placed').each(function(groupNode){
		groupNode.get('.positiveNode, .negativeNode, .positiveConnector, .negativeConnector').show();
	})

	$("#drawing_area").css("cursor","crosshair");
	elementsLayer.draw();
}

function hideConnectors(){
	stage.get('.positiveNode, .negativeNode, .positiveConnector, .negativeConnector').hide();

	connectorsLayer.removeChildren();
	connectorsLayer.draw();
}

function getPosition(position){
	var position = position || stage.getPointerPosition();
	var xPos = Math.round(position.x/10)*10;
	var yPos = Math.round(position.y/10)*10;
	return {x: xPos, y:yPos, hash: ("00" + xPos).slice(-3) + ("00"+yPos).slice(-3)};
}

function placeElement(){
	//get position
	var position = getPosition();
	if(getNode({position: position}).state != 0)
		return;
	//place and create the new element
	cursor.setPosition(position.x,position.y);
	var newElement=cursor.clone();
	newElement.setName('placed')
	elementsLayer.add(newElement);

	if(cursor.getRotationDeg() % 180 == 0)
	{
		for( var i = position.x - 20; i <= position.x - 20+ (cursor.getWidth()) ; i += 10)
		{
			for( var j = position.y - 30; j <= position.y - 30 + (cursor.getHeight()); j += 10)
			{
				getNode({
					position: getPosition( { x : i, y : j } ) 
				}).state = 2;
				//connectorsLayer.add(new Kinetic.Circle({radius:3, strokeWidth:1, fill:'gray', stroke:'black', x: i,	y: j }));
			}
		}
	}
	else
	{
		for( var i = position.x - 30; i <= position.x - 30 + (cursor.getHeight()) ; i += 10)
		{
			for( var j = position.y - 20; j <= position.y - 20 + (cursor.getWidth()); j += 10)
			{
				getNode({
					position: getPosition( { x : i, y : j } ) 
				}).state = 2;
				//connectorsLayer.add(new Kinetic.Circle({radius:3, strokeWidth:1, fill:'gray', stroke:'black', x: i,	y: j }));
			}
				
		}
			
	}

	//hide and redraw
	cursor.hide();
	elementsLayer.draw();
	connectorsLayer.draw();
	showCursor = false;
	md_action = null;
}

$(function(){

	stage = new Kinetic.Stage({
      container: 'drawing_area',
      width: S_WIDTH,
      height: S_HEIGHT
   });
	
	gridLayer = new Kinetic.Layer();
	elementsLayer = new Kinetic.Layer();
	connectorsLayer = new Kinetic.Layer();

	for(var i=10;i<S_HEIGHT;i+=10)
		gridLayer.add(new Kinetic.Line({ points:[0,i,S_WIDTH,i], stroke: 'gray', opacity:.3, strokeWidth: .5}));
	for(var i=10;i<S_WIDTH;i+=10)
		gridLayer.add(new Kinetic.Line({ points:[i,0,i,S_HEIGHT], stroke: 'gray', opacity:.3, strokeWidth: .5}));

	stage.add(gridLayer);
	stage.add(elementsLayer);
	stage.add(connectorsLayer);

	// events assignments
	stage.on('mousedown',mousedown_h);
	stage.on('mousemove', moveActions);

	//bizarre problem with kinetic event assignment must to use jquery events
	$("#drawing_area canvas").mouseleave(hideElement);
	$("#drawing_area canvas").mouseenter(showElement);

	//loadImage(0);
	loadCursors();

	//toolbox elements events
	$("div.toolbox li.element a").click(selectElement);

	$("#tool_wire").click(showConnectors);
	
	$("div.toolbox li a[id!=tool_wire]").click(function(){
		hideConnectors();
	});

	$("#tool_pointer").click(function(){
		md_action = null;
		$("#drawing_area").css("cursor","default");
		hideConnectors();
	});

	$("div.toolbox li.tool a").click(function(){
		showCursor = false;
		shortcut.remove('r');
	});

	$(".toolbox li").click(function(){
		if($(this).hasClass('active')) return;
		$(".toolbox li.active").removeClass('active');
		$(this).addClass('active');
	})
});