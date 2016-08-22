var map;

      require([
        "esri/map",
        "esri/symbols/SimpleMarkerSymbol", 
        "esri/geometry/Point", 
        "esri/SpatialReference",
        "esri/graphic", 
        "esri/Color", 
		"esri/layers/FeatureLayer",
		"esri/geometry/webMercatorUtils",
		"dojo/dom", "dojo/on", "dojo/domReady!"
      ], function(
        Map, 
        SimpleMarkerSymbol,
        Point, 
        SpatialReference,
        Graphic, 
        Color, 
		FeatureLayer,
		webMercatorUtils,
		dom, 
		on
      ) {
	  map = new Map("map", {
	  basemap: "topo",  //For full list of pre-defined basemaps, navigate to http://arcg.is/1JVo6Wd
	  center: [-80, 35], // longitude, latitude
	  zoom: 3
	});
	// GitHub Sync test 2
	// Add sample world cities layer:
	var worldCities = new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer/0");
	
	// Create function to add any layer:
	function addServiceLayer(serviceLayer) {
		map.addLayer(serviceLayer);
	}
	
	// Function specific to SWS layer:
	function addWorldCities() {
		addServiceLayer(worldCities);
	}
	
	// Core essential function to create and plot points on the map
	function createPoint(i,n) {
		var markerSymbol = new SimpleMarkerSymbol();
		markerSymbol.setColor(new Color("#ff0000"));  // you could generate random color too
		var point = new Point(i,n, new SpatialReference({ wkid: 4326 }));
		map.graphics.add(new Graphic(point, markerSymbol));
		map.centerAt(point);
	}
	
	function clearAllGraphics() {
		  map.graphics.clear();
	}

	function clickButton() {
		var n = createRandom90();
		var i = createRandom180();
		console.log("The 90 value is " + n + " and the 180 value is " + i);
		createPoint(i,n);
	}

	// Create random integers within range:
	// Returns a random integer between min (included) and max (excluded)
	// Using Math.round() will give you a non-uniform distribution!
	function getRandomInt(min, max) {
	  return Math.floor(Math.random() * (max - min)) + min;
	}
	function getRandomFloat(min, max) {
	  return Math.floor(Math.random() * (max - min).toFixed(4)) + min;
	}
	function createRandom90() {
		random90 = getRandomFloat(-76.600,76.600);
		return random90;
	}
	function createRandom180() {
		random180 = getRandomInt(-179.900,179.900);
		return random180;
	}
	
	
	// W3W word search operations
	function issueRandPointReq() {
		$.ajax({
		  url: "http://csc-pnasuti7d3.esri.com/arcgis/rest/services/JS_GP/CreateRandomPoint/GPServer/CreateRandomPoint/execute?env%3AoutSR=4326&f=json",
		  success: handlerFunction		  
		});
		
		//display below image in center of page
		function handlerFunction(data) { 
			var jsonResponse = JSON.parse(data);
			var xval = (jsonResponse.results[0].value.features[0].geometry.x);
			var yval = (jsonResponse.results[0].value.features[0].geometry.y);
			createPoint(xval,yval);
		}
	}
	
	function issueW3WRequest() {
		// Use w3w API to find the W3W name instead of GP service:
		var wordsParam = $("#textInput").val();
		wordsParam = wordsParam.split(' ');
		wordsParam = wordsParam.join('.');
		var w3wNameUrl = "https://api.what3words.com/v2/forward"
		postData = {'addr': wordsParam,
			'display': 'full',
			'format': 'json',
			'key': 'XO74TPSQ'
		}
		$.ajax({
			type: "GET",
			url: w3wNameUrl,
			data: postData,
			success: handlerFunction,
		});
		
		function handlerFunction(data) {
			//Error handle and acquire the point to render the graphic:
			var jsonResponse = data;
			var checkFailCodes = (jsonResponse.status.code);
			
			if (checkFailCodes == 300 || checkFailCodes == 102) {
				var w3wAPIMessage = jsonResponse.status.message;
				alert(w3wAPIMessage);
			} else {
				var xval = (jsonResponse.geometry.lng);
				var yval = (jsonResponse.geometry.lat);
				createPoint(xval,yval);
				
				var w3wOutPoint = $("#w3wOutAddress");
				w3wOutPoint.text("Lat is " + yval.toFixed(3) + " and Long is " + xval.toFixed(3));
			} 
			
			/* //Reverse geocode the point to acquire the address
			var latLong = (xval + ", " + yval);
			var addressRequestUrl = "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=" + wordsParam + "&f=json&outSR={"wkid":102100}&outFields=*&maxLocations=6";
			$.ajax({
			  url: addressRequestUrl,
			  success: addressHandlerFunction		  
			}); */
		
			//Direct Geocode an address the point to acquire the address
		}
	}
	
	// Address searching operations
	function addressSearch() {
			var addressTextInput = $("#addressInput").val();
			
			var addressRequestUrl = "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=" + addressTextInput + "&f=json&outSR={'wkid':4326}&outFields=*&maxLocations=6";
			
			$.ajax({
			  url: addressRequestUrl,
			  success: addressHandlerFunction		  
			});
			
			function addressHandlerFunction(data) {
				var jsonResponse = JSON.parse(data);

				var responseArray = (jsonResponse.candidates);
				//console.log(responseArray);
				if (responseArray.length <= 0) {
					alert("No candidates returned!");
				} else {
					var xval = (jsonResponse.candidates[0].location.x);
					var yval = (jsonResponse.candidates[0].location.y);
					createPoint(xval,yval);
				}
				
				// Write the lat long of the address:
				var addressOutPoint = $("#addressOutPoint");
				addressOutPoint.text("Lat is " + yval.toFixed(3) + " and Long is " + xval.toFixed(3));
				
				// Use w3w API to find the W3W name:
				var latLong = (yval + "," + xval);
				w3wNameUrl = "https://api.what3words.com/v2/reverse"
				postData = {'coords': latLong,
					'display': 'full',
					'format': 'json',
					'key': 'XO74TPSQ'
				}
				
				$.ajax({
					type: "GET",
					url: w3wNameUrl,
					data: postData,
					success: success,
				});
				
				function success(data) {
					//console.log(data);
					//var jsonResponse = JSON.parse(data);
					var w3wName = (data.words);
					var addressOutW3W = $("#addressOutW3W");
					//alert(w3wName);
					addressOutW3W.text("W3W names are: " + data.words);
				}
			}
			
	}
	
	// Search and plot location by IP address:
	function ipSearch() {
		  var ipAddress = $("#ipInput").val();
		  var addressRequestUrl = ("http://ip-api.com/json/" + ipAddress + "?fields=520191");
		  
		 $.ajax({
			  url: addressRequestUrl,
			  success: ipHandlerFunction		  
			});
		
		 function ipHandlerFunction(data) {
			 var ipData = data;
			 var x = (ipData.lon);
			 var y = (ipData.lat);
			 alert("Based on the IP address you searched, the country of this IP is in " + ipData.country + ", and the city is called " + ipData.city + " in the " + ipData.regionName + " region. The ISP is " + ipData.isp + " and the timzone is " + ipData.timezone + ".");
			 createPoint(x,y);
			 // write code for handle response from IP search request
		 }
	  }
	
	function findUserIP() {
		var requestUrl = "https://api.ipify.org/?format=json"
		$.ajax({
		  url: requestUrl,
		  success: useripHandlerFunction		  
		});
		function useripHandlerFunction(data) {
			var userip = data;
			userip = userip.ip;
			$("#ipInput").val(userip);
		}
	}
	findUserIP() 
	
	map.on("click", changeHandler);
	  function changeHandler(evt) {
		  var clickPoint = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
		  var xval = clickPoint.x.toFixed(3);
		  var yval = clickPoint.y.toFixed(3);
		  //alert("X is " + xval + " and Y is " + yval);
		  createPoint(xval,yval);
		  
		  // Use w3w API to find the W3W name:
			var latLong = (yval + "," + xval);
			w3wNameUrl = "https://api.what3words.com/v2/reverse"
			postData = {'coords': latLong,
				'display': 'full',
				'format': 'json',
				'key': 'XO74TPSQ'
			}
			
			$.ajax({
				type: "GET",
				url: w3wNameUrl,
				data: postData,
				success: success,
			});
			
			function success(data) {
				//console.log(data);
				//var jsonResponse = JSON.parse(data);
				var w3wName = (data.words);
				var addressOutW3W = $("#addressOutW3W");
				//alert(w3wName);
				addressOutW3W.text("W3W names are: " + data.words);
			}
	  }
		  
	
	// Create variables for the listeners
	var button1 = $("#randpoint");
	var button2 = $("#randpoint2");
	var wordInputButton = $("#wordInputButton");
	var addressInputButton = $("#addressInputButton");
	var clearGraphics = $("#clearGraphics");
	var ipInputButton = $("#ipInputButton");
	
	// Button click listeners
	clearGraphics.bind("click",clearAllGraphics);
	//clearGraphics.bind("click",addWorldCities);
	button1.bind("click", clickButton);
	button2.bind("click", issueRandPointReq);
	wordInputButton.bind("click", issueW3WRequest);
	addressInputButton.bind("click", addressSearch);
	ipInputButton.bind("click", ipSearch);
	
	// Enable enter input on input within form without resubmitting page
	$("#textInput").keyup(function(event) {
		if(event.keyCode == 13){
			$("#wordInputButton").click();
    }
	$("#addressInput").keyup(function(event) {
		if(event.keyCode == 13){
			$("#addressInputButton").click();
    }	

	});
});
});
