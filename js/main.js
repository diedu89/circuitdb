var stage, layer, line;
var isDrawing = false;
var tLine;
var startPoint;
var endPoint;
$(function(){
	stage = new Kinetic.Stage({
      container: 'drawing_area',
      width: 600,
      height: 600
   });
	
	layer= new Kinetic.Layer();
	tLine=new Kinetic.Line({stroke:'black', strokeWidth:3});
	startPoint=new Kinetic.Circle({radius: 3, fill: 'red', stroke: 'black', strokeWidth:.2});
	endPoint = startPoint.clone();

	for(var i=10;i<600;i+=10){
		layer.add(new Kinetic.Line({ points:[0,i,600,i], stroke: 'gray', opacity:.5, strokeWidth: .3}));
		layer.add(new Kinetic.Line({ points:[i,0,i,600], stroke: 'gray', opacity:.5, strokeWidth: .3}));
	}


	tLine.hide();
	startPoint.hide();
	endPoint.hide();

	layer.add(tLine);
	layer.add(startPoint);
	layer.add(endPoint);
	stage.add(layer);

	// events assignments
	stage.on('mousedown',startWiring);
	stage.on('mouseleave',function(){cancelWiring(true)});
	stage.on('mouseup', endWiring);
	stage.on('mousemove', drawing);
})

function startWiring(e){
	startPoint.setPosition(e.offsetX, e.offsetY);
	endPoint.setPosition(e.offsetX, e.offsetY);
	tLine.setPoints([e.offsetX, e.offsetY, e.offsetX, e.offsetY]);

	startPoint.show();
	endPoint.show();
	tLine.show();

	layer.draw();
}

function endWiring(){
	startPoint.hide();
	endPoint.hide();
	tLine.hide();

	layer.add(tLine.clone().show());
	layer.draw();
}

function drawing(e){ 
	if(isDrawing) return;

	endPoint.setPosition(e.offsetX, e.offsetY);
	tLine.setPoints([startPoint.getX(), startPoint.getY(), endPoint.getX(), endPoint.getY()]);

	layer.draw();
}

function cancelWiring(redraw){
	isDrawing = false;
	if (redraw) layer.draw();
}