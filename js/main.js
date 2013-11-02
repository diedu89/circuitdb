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
};

var texts = { 
	"R":{type: "resistencia",symbol:"R"}, 
	"VS":{type: "voltaje",symbol:"V"}, 
	"CS":{type: "corriente",symbol:"I"},
	"VSC":{type: "voltaje",symbol:"V"},
	"CSC":{type: "corriente",symbol:"I"}
};

var circuitNodes = {};

var S_WIDTH=800, S_HEIGHT=600;

var stage, gridLayer, elementsLayer, connectorsLayer, testLayer;
var elements = [];

var counters = { 
	"R":0, 
	"VS":0, 
	"CS":0,
	"VSC":0,
	"CSC":0,
	"N":0,
	"L":0
};

//actions
var states = {
	nothing:0,
	placing:1,
	wiring:2,
	node_analysis:3
};
var state = states.nothing;

var cursor;
var showCursor=false;
var md_action=null;
var selectedObject=null;

var rotation=0;

var path={};

var md_handlers={
	//placeElemnt
	0: placeElement
};

var validator;

function mousedown_h(){
//	console.log("llamada a mousedown " + md_action);
	if(state == states.placing)
		placeElement();
}

function selectElementType(){
	shortcut.remove('r');
	shortcut.add('r',function(){
		cursor.rotateDeg(90);
		cursor.getParent().draw();
	});

	$("#drawing_area").css("cursor","default	");

	cursor=elements[$(this).data("index")]; 
	cursor.setRotationDeg(0);
	
	state = states.placing;
}

function moveActions(){
	if(state == states.placing){
		var event = stage.getPointerPosition();
		cursor.setPosition({x:event.x, y:event.y});
		cursor.draw();
		elementsLayer.draw();
	}
}

function showElement(){
	if(state != states.placing) return;

	cursor.show();
	elementsLayer.draw();
}

function hideElement(){
	if(state != states.placing) return;

	cursor.hide();
	elementsLayer.draw();
}

function loadCursors(){
	var tkGroup;
	var tkPath; 
	var tkCirclePositive, tkCircleNegative, tkConnectorPositive, tkConnectorNegative, tkClickArea, tkText;
	var grpWidth, grpHeight = 60;

	for(letter in symbols){

		tkGroup = new Kinetic.Group();
		grpWidth = (letter=='R')?20:40;
		tkGroup.setWidth(grpWidth);
		tkGroup.setHeight(grpHeight);

		tkGroup.tkPath = new Kinetic.Path({
			data: symbols[letter],
			stroke: 'black',
			strokeWidth: 1.5,
			name: 'elementPath'
		});

		tkGroup.tkCirclePositive = new Kinetic.Circle({
			radius:3,
			strokeWidth:1,
			fill:'gray', 
			stroke:'black',
			x: grpWidth/2,
			y: 0,
			name: 'positiveNode'
		}).hide();
		tkGroup.tkCirclePositive.setAttr('multiplier', 1);

		tkGroup.tkCircleNegative = tkGroup.tkCirclePositive.clone();
		tkGroup.tkCircleNegative.setName('negativeNode');
		tkGroup.tkCircleNegative.setY(grpHeight);
		tkGroup.tkCircleNegative.setAttr('multiplier', -1);		

		tkGroup.tkConnectorPositive = new Kinetic.Rect({
			x: (letter=="R")?0:10,
			y: -10,
			width: 20,
			height: 20 /*,
			strokeWidth: 1,
			stroke:'black'*/
		});

		tkGroup.tkConnectorNegative = tkGroup.tkConnectorPositive.clone();
		tkGroup.tkConnectorNegative.setY(grpHeight - 10);

		tkGroup.tkConnectorPositive.setAttr("point", "positiveNode");
		tkGroup.tkConnectorPositive.setName('positiveConnector');
		tkGroup.tkConnectorNegative.setAttr("point", "negativeNode");
		tkGroup.tkConnectorNegative.setName('negativeConnector');

		tkGroup.tkConnectorPositive.on('click', connectorsClick);
		tkGroup.tkConnectorNegative.on('click', connectorsClick);

		tkGroup.setAttr('elementType',letter);
		// rect add to facilitate click selection
		tkGroup.tkClickArea = new Kinetic.Rect({ 
			x:0, 
			y:10, 
			height:grpHeight - 20, 
			width:grpWidth,
			name: 'clickArea'
		});
		
		tkGroup.tkText = new Kinetic.Text({
			x:4 + grpWidth / 2,
			y:0,
			text: '',
			fontSize: 12,
			fontFamily: "arial",
			fontStyle: 'bold',
			fill: 'blue',
			name: 'labelId'
		})

		tkGroup.add(tkGroup.tkText);
		tkGroup.add(tkGroup.tkClickArea);
		tkGroup.add(tkGroup.tkPath);
		tkGroup.add(tkGroup.tkCirclePositive);
		tkGroup.add(tkGroup.tkCircleNegative);
		tkGroup.add(tkGroup.tkConnectorPositive);
		tkGroup.add(tkGroup.tkConnectorNegative);

		tkGroup.tkText.moveToTop();
		tkGroup.tkClickArea.moveToTop();
		tkGroup.tkConnectorNegative.moveToTop();
		tkGroup.tkConnectorPositive.moveToTop();
		tkGroup.setOffset(grpWidth/2, grpHeight/2)
		tkGroup.hide();

		tkGroup.tkClickArea.moveToTop();
		elements[letter]=tkGroup;

		elementsLayer.add(elements[letter]);
	}
}

//wire
function connectorsClick(){
	if(state != states.wiring) return;	

	var connectorType = this.getAttr('point');
	var connector = this.parent.get('.' + connectorType)[0];

	console.log("click en el conector");
	stage.get('.positiveNode, .negativeNode').each(function(circle){
		circle.setAttr('fill', 'gray');
	});
	connector.setAttr('fill','green');
	
	testLayer.removeChildren();

	connectorsLayer.draw();
	elementsLayer.draw();

	if(path.start != undefined)
	{
		path.start.setAttr('fill','green');
		path.end = connector;
	}
	else
		path.start = connector;

	if(path.start == path.end){
		console.log("son iguales");
		return cancelConnection();
	}

	if(path.start != undefined && path.end != undefined)
	{

		//if try to connect itself cancel
		if(path.start.parent == path.end.parent) 
		{
			console.log("se intenta conectar el mismo elemento");
			return cancelConnection();
		}

		var pathString;
		var pathNodes;
		var initialNode, finalNode;
		var circuitNode = null;
		var elementId;
		var joined = false;
		
		initialNode = getNode( { position: getPosition(path.start.getAbsolutePosition()) } );
		finalNode = getNode( { position: getPosition(path.end.getAbsolutePosition()) });

		//get circuitNode if the pointer already has a circuitNode assigned
		if(initialNode.nodeName != path.start.parent.getAttr('elementId'))
		{
			circuitNode = circuitNodes[initialNode.nodeName];
			console.log("nodo incial ya tiene asignado");
		}

		if(finalNode.nodeName != path.end.parent.getAttr('elementId'))
		{
			//if the initial connector does not have circuitNode assigned, assign the endConnector circuitnode
			console.log("nodo final ya tiene asignado");
			if(circuitNode == null)
				circuitNode = circuitNodes[finalNode.nodeName];
			else
			{
				console.log(finalNode);
				//if both of connectors have assigned circuit node
				if(circuitNodes[finalNode.nodeName].connectedElements[path.start.parent.getAttr('elementId')] != null)
				{
					console.log("ya existe elemento en el segundo nodo");
					return cancelConnection();
				}

				//must merge the nodes				
				//copy elements from second node
				for(index in circuitNodes[finalNode.nodeName].connectedElements)
				{
					if( circuitNode.connectedElements[index] != null)
					{
						console.log("El segundo nodo ya contiene uno de los nodos del primero");
						return cancelConnection();
					}
				}

				for(index in circuitNodes[finalNode.nodeName].connectedElements)
					circuitNode.connectedElements[index] = circuitNodes[finalNode.nodeName].connectedElements[index];					

				//copy lines from second node
				for(index in circuitNodes[finalNode.nodeName].lines)
					circuitNode.lines[index] = circuitNodes[finalNode.nodeName].lines[index];

				//copy gridnodes from second node
				for(index in circuitNodes[finalNode.nodeName].gridNodes)
				{
					circuitNode.gridNodes[index] = circuitNodes[finalNode.nodeName].gridNodes[index];
					if(index != finalNode.hash) grid[index].nodeName = circuitNode.nodeName;
				}
				
				joined = true;

				//delete second node
				console.log("nodo a eliminar: " + finalNode.nodeName);
				delete circuitNodes[finalNode.nodeName];
			}
		}
		
		//if both dont have circuitNode assigned, create a new one
		if(circuitNode == null) circuitNode = { 
			nodeName:'N' + (++counters['N']), 
			connectedElements: {}, 
			lines:{}, 
			gridNodes:{}
		};

		elementId = path.start.parent.getAttr('elementId');

		//
		if(!joined && circuitNode.connectedElements[elementId] != null && circuitNode.connectedElements[elementId].getAttr('name') != path.start.getAttr('name') )
		{
			console.log("el nodo ya contiene el primer elemento con polaridad contraria");
			return cancelConnection();
		}

		circuitNode.connectedElements[elementId] = path.start;

		elementId = path.end.parent.getAttr('elementId');

		if(!joined && circuitNode.connectedElements[elementId] != null && circuitNode.connectedElements[elementId].getAttr('name') != path.end.getAttr('name') )
		{
			console.log("el nodo ya contiene el segundo elemento con polaridad contraria");
			return cancelConnection();
		}

		circuitNode.connectedElements[elementId] = path.end;

		//assign the current/new circuitNode to the graphnodes
		finalNode.nodeName = initialNode.nodeName = circuitNode.nodeName;
		circuitNodes[circuitNode.nodeName] = circuitNode;
		pathNodes = findPath(initialNode.hash, finalNode.hash, circuitNode.nodeName);
		
		if(pathNodes.length > 0){
			++counters.L;
			var gridNode = grid[pathNodes[0]];
			
			pathString = "M" + gridNode.x + ","+ gridNode.y + "L" + gridNode.x + ", "+ gridNode.y +" ";
			circuitNode.gridNodes[pathNodes[0]] = gridNode;
			gridNode.lines.push('L' + counters.L);

			for(i = 1; i < pathNodes.length; i++ )
			{
				gridNode = grid[pathNodes[i]];
				gridNode.nodeName = circuitNode.nodeName;
				gridNode.lines.push('L' + counters.L);
				
				pathString = pathString +"L"+ gridNode.x + "," + gridNode.y + " ";
				
				circuitNode.gridNodes[pathNodes[i]] = gridNode;
			}

			var newLine = new Kinetic.Path({
			    x: 0,
		    	y: 0,
			    data: pathString,
			    strokeWidth: 2,
		        stroke: 'black',
		        id: 'L' + counters.L,
		        name: 'drawnLine'
		    });

		    var newHitLine = new Kinetic.Path({
			    x: 0,
		    	y: 0,
			    data: pathString,
			    strokeWidth: 8,
			    opacity: 0,
			    id:'HL' + counters.L
		    });

			circuitNodes[circuitNode.nodeName].lines['L' + counters.L] = newLine;

			path.start.setAttr('nodeName', circuitNode.nodeName);
			path.end.setAttr('nodeName', circuitNode.nodeName);

			newLine.setAttr('nodeName', circuitNode.nodeName);
			newLine.setAttr('gridNodes', pathNodes);
			newLine.setAttr('startConnector', path.start);
			newLine.setAttr('endConnector', path.end);
			newLine.setAttr('hitLineId', 'HL' + counters.L);

			newHitLine.setAttr('refLineId', 'L' + counters.L);
			newHitLine.on('click', lineClick);

			connectorsLayer.add(newHitLine);
			connectorsLayer.add(newLine);

			newHitLine.moveToTop();

			stage.draw();
			delete path.start;
			delete path.end;
		}
		else
		{
			//unable to connect the elements
			console.log("no se pudo hacer la conexion"); 
			return cancelConnection();
		}
	}
}

function cancelConnection()
{
	path.start.setAttr('fill', 'gray');
	path.end.setAttr('fill', 'gray');
	elementsLayer.draw();
	connectorsLayer.draw();
	delete path.start;
	delete path.end;
	return;
}

function showConnectors(){
	stage.get('.placed').each(function(groupNode){
		groupNode.get('.positiveNode, .negativeNode, .positiveConnector, .negativeConnector').show();
	})

	$("#drawing_area").css("cursor","crosshair");
	elementsLayer.draw();

	state = states.wiring;
}

function hideConnectors(){
	stage.get('.positiveNode, .negativeNode, .positiveConnector, .negativeConnector').hide();
	elementsLayer.draw();
	testLayer.removeChildren();
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
	if(getNode({position: position}).nodeName != "")
		return;
	//place and create the new element

	var elementType = cursor.getAttr("elementType");
	cursor.show();
	console.log(cursor);
	elementsLayer.draw();
	showModal({
		header: "Valor de " + elementType + (counters[elementType] + 1),
		caption: "Ingrese el valor de " + texts[elementType].type,
		callback: function(){
			var elementId = elementType + (++counters[elementType]);
			//var elementType = cursor.getAttr("elementType");

			cursor.setPosition(position.x,position.y);
			cursor.tkText.setAttr('text', elementId);
			switch(cursor.getRotationDeg() % 360){
				case 0:
					cursor.tkText.setPosition(4 + cursor.getWidth() / 2, 0);
					cursor.tkText.setRotationDeg(0);
					break;
				case 90:
					cursor.tkText.setPosition(0, 10);
					cursor.tkText.setRotationDeg(-90);
					break;
				case 180:
					cursor.tkText.setPosition(cursor.getWidth() / 2 - 4, 10);
					cursor.tkText.setRotationDeg(180);
					break;
				case 270:
					cursor.tkText.setPosition(cursor.getWidth(), cursor.getHeight() - 10);
					cursor.tkText.setRotationDeg(90);
					break;
			}
					
			//assign to the nodename the elementId
			getNode({
				position: getPosition(cursor.tkCircleNegative.getAbsolutePosition()) 
			}).nodeName = elementId;
					
			getNode({
				position: getPosition(cursor.tkCirclePositive.getAbsolutePosition()) 
			}).nodeName = elementId;

			var newElement = cursor.clone();
			newElement.setName('placed');
			newElement.setAttr('elementId', elementId);
			newElement.setAttr('value', $("#decimal_input").val());

			newElement.get('.clickArea')[0].on('dblclick', changeValue);
			newElement.get('.clickArea')[0].on('click', elementClick);

			elementsLayer.add(newElement);
			newElement.draw();
			newElement.show();

			console.log(elementType);
			if(elementType == "R")
			{
				if(newElement.getRotationDeg() % 180 == 0)
				{
					for( var i = position.x - 10; i <= position.x - 10 + (cursor.getWidth()) ; i += 10)
					{
						for( var j = position.y - 20; j <= position.y - 40 + (cursor.getHeight()); j += 10)
						{
							getNode({
								position: getPosition( { x : i, y : j } ) 
							}).nodeName = elementId;
							testLayer.add(new Kinetic.Circle({radius:3, strokeWidth:1, fill:'gray', stroke:'black', x: i,	y: j }));
						}
					}	
				}
				else
				{
					for( var j = position.y - 10; j <= position.y - 10 + (cursor.getWidth()) ; j += 10)
					{
						for( var i = position.x - 20; i <= position.x - 40 + (cursor.getHeight()); i += 10)
						{
							getNode({
								position: getPosition( { x : i, y : j } ) 
							}).nodeName = elementId;
							testLayer.add(new Kinetic.Circle({radius:3, strokeWidth:1, fill:'gray', stroke:'black', x: i,	y: j }));
						}
					}	
				}
			}
			else
			{
				for( var i = position.x - 20; i <= position.x - 20 + (cursor.getWidth()) ; i += 10)
				{
					for( var j = position.y - 20; j <= position.y - 20 + (cursor.getWidth()); j += 10)
					{
						getNode({
							position: getPosition( { x : i, y : j } ) 
						}).nodeName = elementId;
						testLayer.add(new Kinetic.Circle({radius:3, strokeWidth:1, fill:'gray', stroke:'black', x: i,	y: j }));
					}
				}				
			}


			//hide and redraw
			cursor.tkText.setText('');
			cursor.hide();
			elementsLayer.draw();
			testLayer.draw();
			md_action = null;
			$("#decimal_input").val("");
		}
	});
}

function changeValue(){
	if(state != states.nothing) return;

	var element = this.parent;
	showModal({
		header: "Valor de " + element.getAttr('elementId'),
		caption: "Ingrese el valor para " + texts[element.getAttr('elementType')].type,
		default_value: this.parent.getAttr('value'),
		callback: function(){
			console.log(element);
			element.setAttr('value', $("#decimal_input").val());
		}
	})
}
 
function showModal(options){
	options.header = options.header || "Entrada de datos";
	options.caption = options.caption || "Ingrese un valor";
	options.example = options.example || "Ejemplo: 123.45";
	options.callback = options.callback || function(){};
	options.default_value = options.default_value || 1;

	$("#modal_input h4").text(options.header);
	$("#modal_input label").text(options.caption);
	$("#modal_input span.help-block").text(options.example);
	$("#modal_layer, #modal_input").show();
	$("#decimal_input").val(options.default_value);

	$("#modal_input a.btn.ok").unbind("click").click(function(){
		if(!$("#modal_input input").valid())
			return;
		options.callback();
		$("#modal_layer, #modal_input").hide();
	})
}

function nodeAnalysis(groundNodeName){
	if( Object.keys(circuitNodes).length == 0) return;

	var groundNode = circuitNodes[groundNodeName];
	var currentConnector, adjacentConnector;
	var currentNode, adjacentNode;
	var SP_name, elementName, EC_name;
	var orderedElements, orderedNodes = [];
	var SP_counter = 0;//supernode counter
	var ECs = {}; //Ecuations
	var X = {}; 
	
	//clear all node analysis variables
	for(nodeName in circuitNodes)
	{
		delete circuitNodes[nodeName].SP;
		delete circuitNodes[nodeName].voltage;
	}

	stage.get('.placed').each(function(group){
		delete group.attrs.SP;
	})

	//set voltage to groundnode
	groundNode.voltage = 0;

	//sort the nodes in order to process the ones adjacent to the ground node first
	for(var elementId in groundNode.connectedElements)
	{
		currentConnector = groundNode.connectedElements[elementId];
		adjacentConnector = getAdjacentConnector(currentConnector);
		adjacentNode = circuitNodes[adjacentConnector.getAttr('nodeName')];		
		
		switch(currentConnector.parent.getAttr('elementType'))
		{
			case "R":
				if(orderedNodes.indexOf(adjacentNode) == -1)
					orderedNodes.push(adjacentNode);
				break;
			case "VS":
				adjacentNode.voltage = adjacentConnector.getAttr('multiplier') * currentConnector.parent.getAttr('value');
				if(orderedNodes.indexOf(adjacentNode) != -1)
					orderedNodes.splice(orderedNodes.indexOf(adjacentNode), 1);
				break;
			default:
				orderedNodes.unshift(adjacentNode);
		}
	}

	for(var nodeName in circuitNodes)
		if(orderedNodes.indexOf(circuitNodes[nodeName]) == -1 && circuitNodes[nodeName] != groundNode && circuitNodes[nodeName].voltage == null)
			orderedNodes.push(circuitNodes[nodeName]);

	//start process to get the matrix
	for(nodeIndex=0; nodeIndex<orderedNodes.length;++nodeIndex)
	{
		currentNode = orderedNodes[nodeIndex];

		//get the nodes ordered in an array
		orderedElements = new Array();
		var pairConnectors;

		//sort elements to process the Voltage source first
		loop_sortNeighbors:
		for(var elementId in currentNode.connectedElements)
		{
			pairConnectors = { 
				currentConnector: currentNode.connectedElements[elementId],
				adjacentConnector: getAdjacentConnector(currentNode.connectedElements[elementId])
			};

			switch(pairConnectors.adjacentConnector.parent.getAttr('elementType'))
			{
				case "R":
				case "CS":
					orderedElements.push(pairConnectors);
					break;
				case "VS":
					adjacentNode = circuitNodes[pairConnectors.adjacentConnector.getAttr('nodeName')];

					//if the adjacent node has voltage calculate current node voltage and break loop
					if(adjacentNode.voltage != null)
					{
						currentNode.voltage = pairConnectors.currentConnector.getAttr('multiplier') * pairConnectors.currentConnector.parent.getAttr('value') + adjacentNode.voltage;
						break loop_sortNeighbors;
					}
					orderedElements.unshift(pairConnectors);
					break;
				default:
					orderedElements.unshift(pairConnectors);
			}			
		}

		//if current node has voltage continue with next node
		if(currentNode.voltage != null) continue;

		SP_name = null;
		loop_connectedElements:
		for(var i=0; i<orderedElements.length; ++i)
		{
			currentConnector = orderedElements[i].currentConnector;
			adjacentConnector = orderedElements[i].adjacentConnector;
			adjacentNode = circuitNodes[adjacentConnector.getAttr('nodeName')];
			elementName = currentConnector.parent.getAttr('elementId');

			switch(currentConnector.parent.getAttr('elementType'))
			{
				case "VS":
					//if the voltage source is connected to ground assign the voltage to current node
					if(adjacentNode == groundNode)
					{
						currentNode.voltage = currentConnector.parent.getAttr('value') * currentConnector.getAttr('multiplier');
						break loop_connectedElements;
					}
					else //it is a supernode
					{
						//get the supernode name or create it if is not setted
						SP_name = currentNode.SP || adjacentNode.SP;
						if(SP_name == null) SP_name = "SP" + (++SP_counter);

						currentNode.SP = adjacentNode.SP = SP_name;

						//add ecuation if is hasnt created for this source
						if(!currentConnector.parent.getAttr('SP'))
						{
							ECs[elementName] = {};
							ECs[elementName][currentNode.nodeName] = currentConnector.getAttr('multiplier');
							ECs[elementName][adjacentNode.nodeName] = adjacentConnector.getAttr('multiplier');
							X[elementName] = parseFloat( currentConnector.parent.getAttr('value') );
						}

						currentConnector.parent.setAttr('SP',SP_name);
					}
					break;
				case "CS":
					EC_name = currentNode.SP || currentNode.nodeName;

					X[EC_name] = X[EC_name] || 0;
					X[EC_name] = X[EC_name] + currentConnector.getAttr('multiplier') * parseFloat(currentConnector.parent.getAttr('value'));
					break;
				case "R":
					EC_name = currentNode.SP || currentNode.nodeName;

					//if the current resistor is parallel cancel the process
					if(adjacentNode.SP && adjacentNode.SP == EC_name) continue;

					ECs[EC_name] = ECs[EC_name] || {};
					ECs[EC_name][currentNode.nodeName] = ECs[EC_name][currentNode.nodeName] || 0;
					ECs[EC_name][currentNode.nodeName] = ECs[EC_name][currentNode.nodeName] + 1 / currentConnector.parent.getAttr('value');

					if(adjacentNode != groundNode)
					{
						if(!adjacentNode.voltage)
						{
							ECs[EC_name][adjacentNode.nodeName] = ECs[EC_name][adjacentNode.nodeName] || 0;
							ECs[EC_name][adjacentNode.nodeName] = ECs[EC_name][adjacentNode.nodeName] + (-1 / currentConnector.parent.getAttr('value'));
						}
						else
						{
							X[EC_name] = X[EC_name] || 0;
							X[EC_name] = X[EC_name] + adjacentNode.voltage / currentConnector.parent.getAttr('value');
						}

					}
					break;
			}
		}
	}

	var cols = {}, rows = {};
	var cols_count = 0, rows_count = 0;
	var matrix = [], xMatrix = [];

	for(var i in ECs){
		rows[i] = rows_count++;
		for(var j in ECs[i])
		{
			if(cols[j] == null)
				cols[j] = cols_count++;
		}
	}
	
	for(var i in rows){
		matrix[rows[i]] = [];
		xMatrix[rows[i]] = X[i] || 0;
		for(var j in cols)
		{
			matrix[rows[i]][cols[j]] = ECs[i][j] || 0;
		}
	}

	var solutionMatrix = numeric.dot(numeric.inv(matrix), xMatrix);
	
	$("#analysis_results ul.nav-list li.node_result").remove();
	for(i in cols)
	{
		circuitNodes[i].voltage = solutionMatrix[cols[i]];
	}

	for(i in circuitNodes)
		$("#label_results").after("<li class='node_result' data-node_name='"+ i +"'><a href='#'>"+ i + ": " + (Math.round(circuitNodes[i].voltage*1000) / 1000) + "</a></li>");

	console.log(matrix);
	console.log(xMatrix);
	console.log(solutionMatrix);
}

function elementClick(){
	if(state != states.nothing) return;

	if(selectedObject && selectedObject.getClassName() == 'Path')
	{
		selectedObject.setStroke('black');
		selectedObject.draw();
	}

	elementsLayer.get('.placed').each(function(element){
		element.get('Path')[0].setStroke('black');
		element.draw();
	});

	selectedObject = this.parent;
	selectedObject.get('Path')[0].setStroke('red');
	selectedObject.draw();
	elementsLayer.draw();
	connectorsLayer.draw();
}

function lineClick(){
	if(state == states.node_analysis)
	{
		selectedObject = connectorsLayer.get('#' + this.getAttr('refLineId'))[0];
		nodeAnalysis(selectedObject.getAttr("nodeName"));
	}
	if(state == states.nothing)
	{
		connectorsLayer.get('.drawnLine').each(function(line){
			line.setStroke('black');
		});

		if(selectedObject && selectedObject.getClassName() == "Group")
		{
			selectedObject.get('Path')[0].setStroke('black');
			selectedObject.get('Path')[0].draw();
			stage.draw();
		}

		selectedObject = connectorsLayer.get('#' + this.getAttr('refLineId'))[0];
		selectedObject.setStroke('red');
		selectedObject.moveToTop();
		this.moveToTop();
		stage.draw();
	}
}

function getAdjacentConnector(currentConnector){
	if(currentConnector.getName() == 'positiveNode')
		return currentConnector.parent.get('.negativeNode')[0];
	else
		return currentConnector.parent.get('.positiveNode')[0];
}

function deleteObject(){
	if(state != states.nothing) return;
	if(selectedObject)
	{
		if(selectedObject.getClassName() == "Path"){
			var circuitNode = circuitNodes[selectedObject.getAttr("nodeName")];
			var gridNodes = selectedObject.getAttr('gridNodes');
			var gridNode;

			for(i=0; i<gridNodes.length; ++i)
			{
				gridNode = grid[gridNodes[i]];
				//remove line id from the lines in the gridnode
				gridNode.lines.splice(gridNode.lines.indexOf(selectedObject.getId()),1)

				if(gridNode.lines.length == 0)
					gridNode.nodeName = "";
			}

			var startConnector = selectedObject.getAttr('startConnector');
			var endConnector = selectedObject.getAttr('endConnector');

			if(grid[gridNodes[0]].nodeName == "")
			{
				endConnector.setAttr('nodeName', endConnector.parent.getAttr('elementId'));
				grid[gridNodes[0]].nodeName = endConnector.parent.getAttr('elementId');
				delete circuitNode.connectedElements[endConnector.parent.getAttr('elementId')];
			}

			if(grid[gridNodes[gridNodes.length-1]].nodeName == "")
			{
				startConnector.setAttr('nodeName', startConnector.parent.getAttr('elementId'));
				grid[gridNodes[gridNodes.length-1]].nodeName = startConnector.parent.getAttr('elementId');
				delete circuitNode.connectedElements[startConnector.parent.getAttr('elementId')];
			}

			delete circuitNode.lines[selectedObject.getId()];

			//it is the only line of the circuitnode, must remove it
			if($.isEmptyObject(circuitNode.lines))
			{
				delete circuitNodes[circuitNode.nodeName];
			}

			console.log(circuitNodes);
			console.log(selectedObject);

			connectorsLayer.get('#' + selectedObject.getAttr('hitLineId'))[0].destroy();
			selectedObject.destroy();
			selectedObject = null;

			stage.draw();
		}
	}
}

function showGroundMessage(){
	showModalMessage(
		"Analisis de nodos", 
		"A continuacion seleccione el nodo tierra para iniciar el analisis de nodos."
	);

	connectorsLayer.get(".drawnLine").each(function(path){
		path.setAttr('strokeWidth', '3');
	});

	connectorsLayer.moveToTop();
	stage.draw();

	$("#drawing_area").css("cursor","default");
	
	$("#design_options").slideUp(function(){
		$("#analysis_results").slideDown();
	});

	state = states.node_analysis;
}

function showModalMessage(header , body){
	$("#modal_message h3").html(header);
	$("#modal_message .modal-body p").html(body);
	$("#modal_message").modal();
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
	testLayer = new Kinetic.Layer();

	for(var i=10;i<S_HEIGHT;i+=10)
		gridLayer.add(new Kinetic.Line({ points:[0,i,S_WIDTH,i], stroke: 'gray', opacity:.3, strokeWidth: .5}));
	for(var i=10;i<S_WIDTH;i+=10)
		gridLayer.add(new Kinetic.Line({ points:[i,0,i,S_HEIGHT], stroke: 'gray', opacity:.3, strokeWidth: .5}));

	stage.add(gridLayer);
	stage.add(elementsLayer);
	stage.add(connectorsLayer);
	stage.add(testLayer);

	elementsLayer.moveToTop();
	elementsLayer.draw();
	testLayer.hide();
	// events assignments
	stage.on('mousedown',mousedown_h);
	stage.on('mousemove', moveActions);

	//bizarre problem with kinetic event assignment must to use jquery events
	$("#drawing_area canvas").mouseleave(hideElement);
	$("#drawing_area canvas").mouseenter(showElement);

	//loadImage(0);
	loadCursors();

	//toolbox elements events
	$("div.toolbox li.element a").click(selectElementType);

	$("#tool_wire").click(showConnectors);
	$("#node_analysis").click(showGroundMessage);
	
	$("div.toolbox li a[id!=tool_wire]").click(function(){
		hideConnectors();
	});

	$("#tool_pointer").click(function(){
		state = states.nothing;

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

	$("#modal_input").draggable({
   		handle: ".modal-header",
   		containment: "parent"
	});

	$("#modal_layer, #modal_input").mouseenter(function(){
		if(state != states.placing) return;
		cursor.show();
		elementsLayer.draw();
	})

	validator = $( "#modal_input form" ).validate({
		submitHandler: function(){},
	  	rules: {
	    	decimal_input: {
	      	required: true,
	      	number: true
	    	}
	  	},
	  	messages:{
	  		decimal_input:{
	  			required: "Debe ingresar un valor",
	  			number: "Debe ingresar un valor decimal"
	  		}
	  	},
	  	errorElement: "div",
	  	errorClass: "alert alert-error"
	});

	$("#modal_input a.btn.cancel, #modal_input button.close").click(function(){
		$("#decimal_input").val("");
		console.log("cancel");
		validator.resetForm();
		$("#modal_layer, #modal_input").hide();
	});

	$('#modal_message button').click(function () {
	  $('#modal_layer, #modal_message').hide();
	});

	$("#analysis_results ul.nav-list").on('click','li.node_result',function(){
		var nodeName = $(this).data("node_name");
		connectorsLayer.get("Path").each(function(path){
			console.log(nodeName);
			if(path.attrs.nodeName == nodeName){
				path.setAttr('stroke', 'blue');
			}
			else
			{
				path.setAttr('stroke', 'black');
			}
			path.draw();
		});
	});

	$("#modal_message, #analysis_results").hide();

	$("#back_to_design").click(function(){
		$("#analysis_results").slideUp(function(){
			$("#design_options").slideDown();
			connectorsLayer.get(".drawnLine").each(function(path){
				path.setAttr('strokeWidth', '2');
				path.setStroke('black');
			});
			stage.draw();
			state = states.nothing;
		});
	});

	shortcut.add('Delete',deleteObject);
});