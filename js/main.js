var stage, layer;
var isDrawing = false;
var imgNames = ["R","VS","CS","VSC","CSC"];
var elements = new Array();
var showCursor=false;
var cursor;
$(function(){
	stage = new Kinetic.Stage({
      container: 'drawing_area',
      width: 800,
      height: 600
   });
	
	layer= new Kinetic.Layer();

	for(var i=10;i<600;i+=10)
		layer.add(new Kinetic.Line({ points:[0,i,800,i], stroke: 'gray', opacity:.3, strokeWidth: .5}));
	for(var i=10;i<800;i+=10)
		layer.add(new Kinetic.Line({ points:[i,0,i,600], stroke: 'gray', opacity:.3, strokeWidth: .5}));


	//layer.add(new Kinetic.Rect({x:50,y:50, width:50, height:50, stroke: 'black', strokeWidth:.5}));
	stage.add(layer);

	// events assignments
	stage.on('mousedown',placeElement);
	stage.on('mousemove', moveActions);

	//bizarre problem with kinetic event assignment must to use jquery events
	$("#drawing_area canvas").mouseleave(hideElement);
	$("#drawing_area canvas").mouseenter(showElement);

	loadImage(0);

	//toolbox elements events
	$("div.toolbox a").click(selectElement);
});

function placeElement(e){
	if(!showCursor) return;
	cursor.setPosition(
		Math.round(cursor.getX()/10)*10,
		Math.round(cursor.getY()/10)*10
	);
	layer.add(cursor.clone());

	cursor.hide();
	showCursor = false;
	console.log();
	layer.draw();
}

function selectElement(){
	if($(this).data("index") == ""){
		showCursor = false;
		return;
	}

	cursor=elements[$(this).data("index")]; 
	showCursor =true;
}

function loadImage(i){
	if(i>=imgNames.length) return;
	var tImg; // temporary image variable
	tImg = new Image();
	console.log(imgNames[i]);
	tImg.onload=function(){
		elements[imgNames[i]]=new Kinetic.Image({
			image: tImg,
			name:'cursor'
		}).hide();

		layer.add(elements[imgNames[i]]);

		loadImage(++i);
		console.log(elements);
	}
	tImg.src="img/"+imgNames[i]+".png";
}

function moveActions(e){
	if(!showCursor) return;
	
	cursor.setPosition({x: e.offsetX-cursor.getWidth()/2, y: e.offsetY-cursor.getHeight()/2});
	layer.draw();
}

function showElement(e){
	if(!showCursor) return;

	cursor.show();
	layer.draw();
}

function hideElement(){
	if(!showCursor) return;
	cursor.hide();
	layer.draw();
}