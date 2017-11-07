/* ******************************************************
 *
 *   Comprehensive Map Gallery using leaflet - methods javascript
 *
 *   Author: Luyu Liu 
 *   Contact: liu.6544@osu.edu
 *
 * ******************************************************* */
function testFailedHandle() //error information
{
	document.getElementById("rickroll-box").innerHTML = "<div align='center'><h1>Sorry no such things...for now</h1></div> <div align='center'> <img src='img/rickroll.gif'> </div>"
	$("#rickroll-modal").modal("show");
}






if (!("ontouchstart" in window)) { //highlight
	$(document).on("mouseover", ".feature-row", function (e) {
		highlight.clearLayers().addLayer(L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle));
	});
}

$(document).on("mouseout", ".feature-row", clearHighlight); //clear highlight when mouse out of feature-row

function clearHighlight() {
	highlight.clearLayers();
}

//------------------------------------sidebar------------------------------------
function animateSidebar() {
	$("#sidebar").animate({
		width: "toggle"
	}, 350, function () {
		map.invalidateSize();
	});
}

function sizeLayerControl() {
	$(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
	$("#layer-list").height($(window).height() / 2);
	$("#table-wrapper").height($(window).height() / 2);
}

function sidebarClick(id, layerID) { //click on the sidebar handle
	markerClusters = eval(layerID + "Layer");
	var alayer = markerClusters.getLayer(id);
	map.setView([alayer.getLatLng().lat, alayer.getLatLng().lng], 17);
	alayer.fire("click");
	/* Hide sidebar and go to the map on small screens */
	if (document.body.clientWidth <= 767) {
		$("#sidebar").hide();
		map.invalidateSize();
	}
}

function syncSidebar() { //update the siderbar
	/* Empty sidebar features */
	$("#feature-list tbody").empty();
	/* Loop through stations layer and add only features which are in the map bounds */
	for (var i in POIFlagList) {
		var pictureURL = "img/" + i + ".png";
		var layerIDFullLayer = eval(i + "FullLayer");
		layerIDFullLayer.eachLayer(function (layer) {
			//if (map.hasLayer(bikeshr_cogoLayer)) {
			if (map.getBounds().contains(layer.getLatLng())) {
				$("#feature-list tbody").append('<tr class="feature-row" layerID="' + i + '" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="18" height="18" src="' + pictureURL +
					'"></td><td class="feature-name">' + layer.feature.properties.name + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
			}
			//}
		});
	}

}


//------------------------------------addhandle.js------------------------------------
function receiveJsonp(URL2, layerID, jsonp, acolor) {
	if (acolor === undefined && aweight === undefined) {
		acolor = "brown"
		aweight = 1
	}

	switch (jsonp) {
		case "JSON":
			var ajax2 = $.ajax({
				url: URL2,
				dataType: 'jsonp',
				jsonpCallback: 'getjson',
				success: getjson
			});
			var geoJsonLayer = new L.GeoJSON(null, {
				style: function style(feature) {
					return {
						weight: aweight,
						opacity: 1,
						color: acolor,
						fill: false
					};
				},
				pane: layerID + "Pane"
			});

			function getjson(data) {
				geoJsonLayer.addData(data);
			}
			return geoJsonLayer;
			break;

		default:
			$.getJSON(URL2, function (data) {
				var geoJsonLayer = new L.GeoJSON(data, {
					style: function style(feature) {
						return {
							weight: aweight,
							opacity: 1,
							color: acolor,
							fill: false
						};
					},
					pane: layerID + "Pane"
				});
				return geoJsonLayer;
			})
	}

}

function addingJsonPointsHandle(layerID, URL, symbolType, awcolor) {
	var anewicon = L.AwesomeMarkers.icon({
		icon: symbolType,
		markerColor: awcolor,
		shadow: null
	});
	anewicon.options.shadowSize = [0, 0]

	newLayer = L.geoJson(null, {
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng, {
				icon: anewicon,
				title: feature.properties.name,
				riseOnHover: true,
				pane: layerID + "Pane"
			});
		}
	})

	$.get(URL, function (data) {
		newLayer.addData(data);
	});

	return newLayer;
}

//--------------------------------------Legend------------------------------------
function addLegendHandle(layerID, url, grades, colors) {
	switch (layerID) {
		case "tree":
			getMapServerLegendDiv(layerID, url + '/legend?f=pjson')
			break;

		case "homeown":
			getGraduatedColorsDiv(layerID, grades, colors)
			break;

		case "sewer":
			getIconBlockDiv(layerID, "filter", "green", "sewer")
			break;

		case "bikepath_path":
			getMapServerLegendDiv(layerID, url + '/legend?f=pjson')
			break;

		case "bikepath_green":
			getIconBlockDiv(layerID, "line", "blue", "Greenway")
			break;

		case "bikepath_heads":
			getIconBlockDiv(layerID, "cog", "red", "Trailheads")
			break;

		case "bikeshr_cogo":
			getIconBlockDiv(layerID, "pic", null, "Cogo", "./img/bikeshr_cogo.png")
			break;

		case "bikeshr_zgst":
			getIconBlockDiv(layerID, "pic", null, "Zagster", "./img/bikeshr_zgst.png")
			break;


	}


}


function getMapServerLegendDiv(layerID, url) { //return one map's legend
	var alegendContent = '<table><tbody>'
	$.ajax({
		url: url,
		type: 'GET',
		async: false,
		dataType: 'JSON',
		success: function (data) {
			for (var i in data.layers["0"].legend) {
				labelContent = data.layers["0"].legend[i].label;
				alegendContent += "<tr valign='middle'>" +
					"<td class='tablehead' align='middle'><img src='data:image/png;base64," + data.layers["0"].legend[i].imageData + "'></td>" +
					"<td class='tablecontent' align='right'><span>" + labelContent + "</span><td>" + "</tr>"
			}
			alegendContent += "</tbody><table>"
			document.getElementById('legend-' + layerID + '-collapse').innerHTML = alegendContent;
		}
	})

}

function getGraduatedColorsDiv(layerID, grades, colors) { //grades.length must === colors.length


	var legendContent2 = '<table><tbody>'
	for (var i in grades) {
		if (i == 0) {
			labelContent2 = grades[i] + " +"
		} else {
			labelContent2 = grades[i] + " - " + grades[i - 1]
		}
		legendContent2 += "<tr valign='middle'>" +
			"<td class='tablehead' align='middle'>" + getColorBlockString(colors[i]) + "</td>" +
			"<td class='tablecontent' align='right'><span>" + labelContent2 + "</span><td>" + "</tr>"
	}
	legendContent2 += "</tbody><table>"
	document.getElementById('legend-' + layerID + '-collapse').innerHTML = legendContent2;
}

function getColorBlockString(color) {
	var div = '<div class="legendbox" style="padding:0px;background:' + color + '"></div>'
	return div;
}

function getIconBlockString(color, icon) {
	var div = '<div class="legendbox" style="padding:0px;background:' + color + '"><i class="fa fa-' + icon + '" aria-hidden="true" style="color:#ffffff"></i></div>'
	return div;
}

function getIconBlockDiv(mapID, icons, colors, names, url) {
	/*var legendContent = '<div class="legendcontent" id="' + mapID + '-legendcontent"><a data-toggle="collapse" href="#legend-' + mapID + '-collapse">' + mapID + '</a>' +
		'<div id="' + 'legend-' + mapID + '-collapse' + '" class="panel-collapse collapse in" role="tabpane2" aria-labelledby="headingOne0" aria-expanded="true"></div></div>'

	legend.getContainer().innerHTML += legendContent*/

	var legendContent2 = '<table><tbody>'
	if (icons == "pic") {
		legendContent2 += "<tr valign='middle'>" +
			"<td class='tablehead' align='middle'>" + getPicBlockString(url) + "</td>" +
			"<td class='tablecontent' align='right'><span>" + names + "</span><td>" +
			"</tr>"
	} else {
		if (icons == "line") {
			legendContent2 += "<tr valign='middle'>" +
				"<td class='tablehead' align='middle'>" + getColorLineString(colors) + "</td>" +
				"<td class='tablecontent' align='right'><span>" + names + "</span><td>" +
				"</tr>"

		} else {
			legendContent2 += "<tr valign='middle'>" +
				"<td class='tablehead' align='middle'>" + getIconBlockString(colors, icons) + "</td>" +
				"<td class='tablecontent' align='right'><span>" + names + "</span><td>" +
				"</tr>"
		}
	}


	legendContent2 += "</tbody><table>"
	document.getElementById('legend-' + mapID + '-collapse').innerHTML = legendContent2;
}

function getPicBlockString(url) {
	var div = '<img src=' + url + '>'
	return div;
}

function getColorLineString(color) {
	var div = '<hr width="26px" style="background-color:' + color + '; border-width:0;">'
	return div;
}

//for homeown, mouse events
function onEachAdminFeatureForHomeown(feature, layer) {
	layer.on({
		mouseover: function (e) {
			thisLayerID = e.target.options.pane.substring(0, e.target.options.pane.indexOf("P"))
			var layer = e.target;
			layer.setStyle({
				weight: 5,
				color: '#999',
				fillOpacity: 0.7
			});


			//info.update(popupContent);

		},
		mouseout: function (e) {
			eval(thisLayerID + "Layer" + ".resetStyle(e.target);")
		},
		click: function (e) {
			// TODO: click
			feature = e.target.feature;
			var popupContent = "<h4>" + "Census Tract: " + feature.properties.TRACT + "</h4>" +
				"Housing Units: " + Number(feature.properties.HSE_UNITS) + "<br/>" +

				"Vacant Units: " + feature.properties.VACANT + "<br/>" +
				"Owner Occupied Units: " + feature.properties.OWNER_OCC + "<br/>" +
				"Rental Units: " + feature.properties.RENTER_OCC + "<br/>" +
				"Population/SQMI 2013: " + Math.floor(feature.properties.POP13_SQMI);

			var popup = L.popup().setLatLng([e.latlng.lat, e.latlng.lng]).setContent(popupContent).openOn(map);
		}
	});
}

function getColorx(val, grades, colors) {
	for (i = 0; i < grades.length; i++)
		if (val >= grades[i])
			return colors[i];
	return '#ffffff';
}

//------------------------------------About 'Layer Settings' menu------------------------------------
function changeBasemap(basemap) { //change the icon of each options when changing basemap
	map.removeLayer(baseLayer);
	baseLayer = L.esri.basemapLayer(getLayerName(basemap), pane = "basemapPane");
	map.addLayer(baseLayer);
	document.getElementById(baseLayerID).innerHTML = document.getElementById(baseLayerID).innerHTML.substring(document.getElementById(baseLayerID).innerHTML.indexOf('/') + 4, document.getElementById(baseLayerID).innerHTML.length)
	document.getElementById(basemap).innerHTML = '<i class="fa fa-check" aria-hidden="true"></i> ' + document.getElementById(basemap).innerHTML;
	baseLayerID = basemap;
}

/*
function changeButtonStatus(layerID) { //to change the icon in the buttons of each map
	try {
		if (mapFlagList[layerID] == null) {
			document.getElementById(layerID + "-btn").innerHTML = '<i class="fa fa-check" aria-hidden="true"></i> ' + document.getElementById(layerID + "-btn").innerHTML.substring(document.getElementById(layerID + "-btn").innerHTML.indexOf('/') + 4, document.getElementById(layerID + "-btn").innerHTML.length)
		} else {
			document.getElementById(layerID + "-btn").innerHTML = '<i class="fa fa-circle" aria-hidden="true"></i> ' + document.getElementById(layerID + "-btn").innerHTML.substring(document.getElementById(layerID + "-btn").innerHTML.indexOf('/') + 4, document.getElementById(layerID + "-btn").innerHTML.length)
		}
	} catch (err) {}

}*/

//------------------------------------For sortable------------------------------------
function generateBase36Id(el) {
	var str = el.tagName + el.className + el.src + el.href + el.textContent,
		i = str.length,
		sum = 0;

	while (i--) {
		sum += str.charCodeAt(i);
	}

	return sum.toString(36);
}

function getBoundsMapServer(url) {
	var a;
	$.ajax({
		url: url,
		type: 'GET',
		async: false,
		dataType: 'JSON',
		success: function (data) {
			a = data.extent;
		}
	})

	return a;
}

function returnBounds(layerID) { //used to put this in the bottom of addhandle.js, due to ajax's async so can't. So just put this into buttons' click listener.
	switch (fullLayerFlags.getItemBylayerID(layerID).dataType) {
		case 1: //json
			var extent;
			eval('extent=' + layerID + "Layer.getBounds()")
			return extent;
			break;

		case 2: //feature
			var aUrl;
			eval('var currentLayer=' + layerID + 'Layer')
			aUrl = currentLayer.options.url;
			var theend = aUrl.indexOf("MapServer");
			aUrl=aUrl.substring(0,theend+9);
			console.log(aUrl)
			eval('var extent=getBoundsMapServer(aUrl+"/info/iteminfo?f=pjson");')
			var corner1=L.latLng(extent[0][1],extent[0][0])
			var corner2=L.latLng(extent[1][1],extent[1][0])
			extent = L.latLngBounds(corner1, corner2)
			
			return extent;
			break;

		case 3: //tile
			var aUrl;
			eval('var currentLayer=' + layerID + 'Layer')
			aUrl = currentLayer._url;
			var theend = aUrl.indexOf("/tile");
			aUrl=aUrl.substring(0,theend);
			eval('var extent=getBoundsMapServer(aUrl+"/info/iteminfo?f=pjson");')
			var corner1=L.latLng(extent[0][1],extent[0][0])
			var corner2=L.latLng(extent[1][1],extent[1][0])
			extent = L.latLngBounds(corner1, corner2)
			return extent;
			break;

		default:





	}
}

function getLayerName(layerID) { //from layerID to get full name of layer, the name 
	switch (layerID) {
		case "esriDarkGray":
			mapName = "DarkGray";
			return mapName;
			break;
		case "esriTopo":
			mapName = "Topographic";
			return mapName;
			break;
		case "esriImagery":
			mapName = "Imagery";
			return mapName;
			break;
		case "esriGray":
			mapName = "Gray";
			return mapName;
			break;
		case "bikeshr":
			mapName = "Bike Sharing Stations";
			return mapName;
			break;

		case "air":
			mapName = "Central Ohio Air Quality";
			return mapName;
			break;

		case "homeown":
			mapName = "Home Ownership";
			return mapName;
			break;

		case "cota":
			mapName = "COTA Ridership";
			return mapName;
			break;

		case "wshd":
			mapName = "Watersheds";
			return mapName;
			break;

		case "eth":
			mapName = "Ethnic Dot Density";
			return mapName;
			break;

		case "sdw":
			mapName = "Sidewalk Inventory";
			return mapName;
			break;

		case "sewer":
			mapName = "Sewer Overflow";
			return mapName;
			break;

		case "demo":
			mapName = "Franklin Demographics";
			return mapName;
			break;

		case "bikepath":
			mapName = "Bike Paths in Central Ohio";
			return mapName;
			break;

		case "water":
			mapName = "Water Pollution";
			return mapName;
			break;

		case "gas":
			mapName = "Columbus Gas Prices";
			return mapName;
			break;

		case "trans":
			mapName = "OSU Campus Transportation";
			return mapName;
			break;

		case "tree":
			mapName = "Columbus Trees";
			return mapName;
			break;

		case "ohio":
			mapName = "Ohio";
			return mapName;
			break;


		default:
			return layerID
			alert("new layer")
			break;

	}
}

//------------------------------------------add layer-===---------------------------------------
function addDefaultHandles(layerID, dataType, URL, symbolType, jsonp, acolor) //尚未添加图例
{
	if (dataType == "JSON Points") {
		eval(layerID + "Layer=addingJsonPointsHandle(layerID, URL,symbolType,acolor);")
		eval("map.addLayer(" + layerID + "Layer);")
		flagList[layerID] = 1;
		return false;
	}

	if (dataType == "JSON Polyline/Polygon") {
		eval(layerID + "Layer = receiveJsonp(URL, layerID,jsonp,acolor);")
		eval("map.addLayer(" + layerID + "Layer);")
		flagList[layerID] = 1;
		return false;
	}

	if (dataType == "GeoServer tiles") {
		eval(layerID + "Layer = L.esri.tiledMapLayer({" +
			"url: '" + URL + "'," +
			"pane: layerID + 'Pane'" +
			"});")
		eval("map.addLayer(" + layerID + "Layer);")
		flagList[layerID] = 1;
		return false;
	}
}


//addLayerHandle: when add button is pushed, this method is fired.
//Include: add items and their eventlisteners, remove eventlisteners
function addLayerHandle(layerID, dataType, URL, symbolType, jsonp, color) {
	//create pane for each layer, so that adjusting zindex is possible. Pane is a DOM so avoid use same name as layer.
	var layerPaneID = layerID + "Pane";
	if (!map.getPane(layerPaneID)) {
		map.createPane(layerPaneID);
	}
	if (symbolType === undefined) {
		symbolType = "cog";
	}
	if (color === undefined) {
		color = "#000000";
	}


	//syncSidebar(); //refresh POIList


	var neodiv = document.createElement('div');
	neodiv.innerHTML = "<div class=\"list-group-item\" id=\"" + layerID + "-list-item\" style='padding-left:10px;padding-right:5px'>" + //list-group-item
		"<div class=\"panel-heading\" style=\"width:230px;height:20px;padding:0;margin:0px\">" + //wrapper

		//checkbox
		"<div class=\"checkbox checkbox-primary\" title=\"Click to show or hide the layer\" style=\"float:left ; margin: auto\">" +
		"<input type=\"checkbox\" id=\"" + layerID + "-checkbox" + "\" class=\"styled\" unchecked style=\"float:left;vertical-align: middle\">" +
		"<label>" +
		"<span style=\"float:left;vertical-align: middle\" class=\"glyphicon glyphicon-move\" title=\"Drag to change the sequence of layers\" aria-hidden=\"true\"></span>&nbsp" + //dragger
		"</label>" +
		"</div>" +
		//checkbox end


		//"<div class=\"panel-title\" style=\"float:left\">" +
		"<a style=\"float:left\" id=\"" + layerID + "-metadata" + "\" title=\"The metadata of the layer\" valign=\"top\" href=\"#\">" + getLayerName(layerID) + "</a>" + //metadata
		"<a class=\"accordion-toggle collapsed\" data-toggle=\"collapse\" data-parent=\"#accordion\" style=\"vertical-align: middle; float:right\" href=\"#" + layerID + "-controlcontainer" + "\" title=\"Click to show or hide the control box\">" +
		"</a>" +
		//"</div>" +
		"</div>" +

		"<div id=\"" + layerID + "-controlcontainer" + "\" style='width:230px;margin:0' class=\"panel-collapse collapse\" title=\"Click to open the legend\">" + //control wrapper
		"<div class=\"panel-body\" style=\"width:230px;padding:0px;margin:0px\"><br>" + //wrapper

		"<a id=\"" + layerID + "-legend-btn\" class=\"btn btn-info btn-xs\" title=\"Click to open the legend\" data-toggle=\"collapse\" href=\"#legend-" + layerID + "-collapse\">" + '<b' + ' class="fa fa-info-circle" aria-hidden="true"></b>' + " Legend</a>" + //legendbutton
		"&nbsp&nbsp&nbsp<a id=\"" + layerID + "-upmost-btn\" class=\"btn btn-primary btn-xs\" title=\"Click to move this layer to the top\">" + '<b' + ' class="fa fa-thumbs-up" aria-hidden="true"></b>' + " Upmost</a>" + //legendbutton
		"&nbsp&nbsp&nbsp<a id=\"" + layerID + "-zoomto-btn\" class=\"btn btn-success btn-xs\" title=\"Click to zoom in the layer\">" + '<b' + ' class="fa fa-search-plus" aria-hidden="true"></b>' + " Zoomto</a>" + //legendbutton


		"<input id=\"" + layerID + "-slider\"type=\"range\" value=\"100\" title=\"Drag to adjust the opacity of the layer\">" + //slider

		'<div class="legendcontent" id="' + layerID + '-legendcontent">' + //legendcontent
		'<div id="' + 'legend-' + layerID + '-collapse' + '" class="panel-collapse collapse collapse" role="tabpanel" aria-labelledby="headingOne0" aria-expanded="true"></div></div>' +
		"</div>" +
		"</div>" +
		"</div>"
	document.getElementById("layer-list").prepend(neodiv);

	$("#" + layerID + "-metadata").click(function () { //metadata
		$("#meta-modal").modal("show");
		$(".navbar-collapse.in").collapse("hide");
		return false;
	});

	//-----legend------if you are looking for the real adding legend sentence, pls go to add handle's bottom
	$('#' + layerID + "-legend-btn").click(function () {
		if (!$('#' + layerID + "-checkbox").prop('checked')) {
			alert("Please add the layer first.");
		}

	});

	//------upmost------
	$('#' + layerID + "-upmost-btn").click(function () {
		var layerListOrder = asortable.toArray();
		var currentItem = document.getElementById(layerID + "-list-item").parentNode;
		var currentBase36Id = generateBase36Id(currentItem);
		for (var i = 0; i < layerListOrder.length; i++) {
			if (currentBase36Id == layerListOrder[i]) {
				var tempId = layerListOrder[i];
				layerListOrder.splice(i, 1);
				layerListOrder.unshift(tempId);
				break;
			}
		}
		asortable.sort(layerListOrder);
		sortLayerHandle(e)
	});

	//------zoomto------
	$('#' + layerID + "-zoomto-btn").click(function () {
		//eval("map.fitBounds("+layerID+"Layer.getBounds())")
		var bounds=returnBounds(layerID)
		console.log(bounds)
		map.fitBounds(bounds)
		//eval('map.fitBounds('+layerID+'Layer.query().bounds())')
		//eval('map.fitBounds(L.featureGroup(['+layerID+'Layer]).getBounds())')
	});

	//------slider------
	$('#' + layerID + "-slider").rangeslider({
		polyfill: true,
	});

	$('#' + layerID + "-checkbox").change(function () {
		if ($(this).prop('checked')) {
			//add layer to the map by layerID
			checkedHandle(layerID, dataType, URL, symbolType, jsonp, color);
			//include a delete button, a icon, a slider (basically)
		} else {
			uncheckedHandle(layerID);
		}
	});

	var selector = "#" + layerID + "-slider"
	$(document).on('input', selector, function (e) {
		map.getPane(layerPaneID).style.opacity = (e.currentTarget.value / 100);
	})

}


//sort layer handle according to the list order in list-group aka 'layer-list'
function sortLayerHandle(e) {
	var sortList = asortable.toArray();
	var baseZindex = 300;
	for (var i = 0; i < sortList.length; i++) {
		//hint:  contentwrapper=document.getElementsByClassName("simplebar-content")[0]
		currentLayerID = contentwrapper.children[i].children[0].id.substring(0, contentwrapper.children[i].children[0].id.indexOf("-"));
		try {
			map.getPane(currentLayerID + "Pane").style.zIndex = baseZindex - i;
		} catch (err) {
			alert("Please add the layer first.")
		}
	}
}

//get layer's mapID
function getLayerParent(layerID) { //very ugly codes...
	switch (layerID) {
		case "bikeshr_cogo":
			return "bikeshr";
			break;
		case "bikeshr_zgst":
			return "bikeshr";
			break;
		case "bikepath_heads":
			return "bikepath";
			break;
		case "bikepath_green":
			return "bikepath";
			break;
		case "bikepath_path":
			return "bikepath";
			break;

		default:
			return layerID;
	}
}

//get map's layerID
function getLayerChildren(layerID) { //very ugly codes...
	switch (layerID) {
		case "bikeshr":
			return ["bikeshr_cogo", "bikeshr_zgst"];
		case "bikepath":
			return ["bikepath_heads", "bikepath_green", "bikepath_path"]

		default:
			return [layerID]


	}
}

//deletebutton of each layer handle
function uncheckedHandle(layerID) {

	/*$("#" + layerID + "-metadata").off("click");
	$("#" + layerID + "-legend").off("click");
	$('#' + layerID + "-slider").off("rangeslider");
	$('#' + layerID + "-checkbox").off("change");
	$("#" + layerID + "-slider").off("input"); //turn off the eventhandler*/

	deletelegend = document.getElementById("legend-" + layerID + "-collapse")
	deletelegend.innerHTML = ''

	/*$("#" + layerID + "-listItem").animate({
		height: "0px"
	}, 100, function () {
		document.getElementById(layerID + "-listItem").parentElement.remove();
	});*/

	//map.removeLayer(eval(layerID + "Layer"));
	eval('map.removeLayer(' + layerID + 'Layer);')


	var Sibling = getLayerChildren(getLayerParent(layerID));


	delete flagList[layerID];
	if (POIFlagList[layerID]) {
		delete POIFlagList[layerID];
	}


	//adjust the status of buttons
	/*
	if (Sibling.length == 1) {
		changeButtonStatus(getLayerParent(layerID));
		delete mapFlagList[getLayerParent(layerID)];
		return false;
	}
	for (var otherSibling in Sibling) {
		console.log(otherSibling)
		console.log(Sibling[otherSibling])
		if (flagList[Sibling[otherSibling]]) {
			break;
		}
		if (Sibling[otherSibling] == Sibling[Sibling.length - 1]) {
			changeButtonStatus(getLayerParent(layerID));
			delete mapFlagList[getLayerParent(layerID)];
		}
	}*/
	syncSidebar();
}