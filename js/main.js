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

var stage, gridLayer, elementsLayer, connectorsLayer;
var drawNodes= new Object();

var elements = new Array();

var showCursor=false;
var cursor;

var rotation=0;

$(function(){

	stage = new Kinetic.Stage({
      container: 'drawing_area',
      width: 800,
      height: 600
   });
	
	gridLayer = new Kinetic.Layer();
	elementsLayer = new Kinetic.Layer();

	for(var i=10;i<600;i+=10)
		gridLayer.add(new Kinetic.Line({ points:[0,i,800,i], stroke: 'gray', opacity:.3, strokeWidth: .5}));
	for(var i=10;i<800;i+=10)
		gridLayer.add(new Kinetic.Line({ points:[i,0,i,600], stroke: 'gray', opacity:.3, strokeWidth: .5}));

	stage.add(gridLayer);
	stage.add(elementsLayer);

	// events assignments
	stage.on('mousedown',placeElement);
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
		$("#drawing_area").css("cursor","default");

		hideConnectors();
	});

	$("div.toolbox li.tool a").click(function(){
		shortcut.remove('r');
	});

	$(".toolbox li").click(function(){
		if($(this).hasClass('active')) return;
		$(".toolbox li.active").removeClass('active');
		$(this).addClass('active');
	})
});

function placeElement(e){
	if(!showCursor) return;
	var xPos = Math.round(cursor.getX()/10)*10;
	var yPos = Math.round(cursor.getY()/10)*10;
	cursor.setPosition(xPos,yPos);

	var newElement=cursor.clone();
	newElement.setName('placed')
	newElement.on('click',function(){
		console.log(this.getX());
		this.get('Path')[0].setStroke('blue');
		this.draw();
		this.getParent().draw();
	})
	elementsLayer.add(newElement);

	cursor.hide();
	showCursor = false;
	elementsLayer.draw();
}

function selectElement(){
	shortcut.remove('r');
	shortcut.add('r',function(){
		cursor.rotateDeg(90);
		console.log(cursor.getRotationDeg());
		cursor.getParent().draw();
	});

	$("#drawing_area").css("cursor","move");

	if($(this).data("index") == ""){
		showCursor = false;
		return;
	}

	cursor=elements[$(this).data("index")]; 
	cursor.setRotationDeg(0);
	showCursor =true;
}

function moveActions(){
	if(!showCursor) return;

	var event = stage.getPointerPosition();
	cursor.setPosition({x:event.x, y:event.y});
	cursor.draw();
	elementsLayer.draw();
}

function showElement(e){
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
	var tkCirclePositive, tkCircleNegative;
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

		tkGroup.add(tkPath);
		tkGroup.add(tkCirclePositive);
		tkGroup.add(tkCircleNegative);

		// rect add to facilitate click selection
		tkGroup.add(new Kinetic.Rect({ x:0, y:0, height:grpHeight, width:grpWidth}))
		tkGroup.setOffset(grpWidth/2, grpHeight/2)
		tkGroup.hide();

		elements[letter]=tkGroup;

		elementsLayer.add(elements[letter]);
	}
}

function showConnectors(){
	stage.get('.placed').each(function(groupNode){
		groupNode.get('.positiveNode, .negativeNode').show();
	})

	$("#drawing_area").css("cursor","crosshair");
	elementsLayer.draw();
}

function hideConnectors(){
	stage.get('.positiveNode, .negativeNode').hide();
	elementsLayer.draw();
}