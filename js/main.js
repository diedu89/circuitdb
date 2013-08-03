var stage, layer, line;
var isDrawing = false;
$(function(){
	stage = new Kinetic.Stage({
      container: 'drawing_area',
      width: 600,
      height: 600
   });

	layer= new Kinetic.Layer();

	var i;
	for(i=10;i<600;i+=10){
		layer.add(new Kinetic.Line({ points:[0,i,600,i], stroke: 'gray', opacity:.5, strokeWidth: .3}));
		layer.add(new Kinetic.Line({ points:[i,0,i,600], stroke: 'gray', opacity:.5, strokeWidth: .3}));
	}

	stage.on('mousedown',startWiring);
	stage.on('mouseleave',function(){isDrawing=false});
	stage.on('mouseup',endWiring);
	stage.on('mousemove', drawing);
	stage.add(layer);
})

function startWiring(e){
	var circle=new Kinetic.Circle({
		x: e.offsetX,
		y: e.offsetY,
		radius: 3,
		fill: 'red',
		stroke: 'black'
	})
	layer.add(circle);
	layer.draw();
	//tempLine=new Kinetic.Line({})
}

function endWiring(){

}

function drawing(){ 
	if(isDrawing) return;
}