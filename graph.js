// By Alex Krusz at Velir

//Width and height
var w = 800;
var h = 550;
var barPadding = 1;
var bottomMargin = 42;
var leftMargin = 40;
var startingX = 0;
var xStep = 1;
var verticalDataPixels = h - bottomMargin;
var minDisplayValue = Infinity;
var maxDisplayValue = -Infinity;

var data1 = [ 8, 10, 14, 19, 21, 26, 23, 19, 15, 12,
				10, 8, 9, 11, 14, 17, 16, 18, 23, 25 ];
var data2 = [ 19, 18, 16, 15.5, 15, 17, 18.5, 17, 16.2, 14,
				13.5, 13, 13, 13.5, 15, 18, 19, 17.5, 16.5, 16 ];
				
var stdDevs1 = [ 1.5, 2, 2.5, 3, 3.5, 4.5, 2.5, 2, 1.5, 2.2,
				3, 3.5, 4, 4.5, 5.5, 4, 3, 2.5, 2.3, 1.8 ];
var stdDevs2 = [ .5, .5, .6, .75, 1, 1.2, .75, .73, .5, .6,
				.75, .8, 1, 1.2, 1.4, .75, 1, .70, .65, .5 ];
var stdDevs3 = [ 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 
				0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01 ];

var userData = "10,3; 11,4; 14,5; 19,6";
$('#user-data').val(userData);

$("form input").change(function () {
	var userData = $('#user').is(':checked');
	$('div.dataset').toggle(userData);
	$('p.std-dev').toggle(!userData);
	generateGraph();
});

$("#opacityDiff").keyup(function () {
	var opacity = parseFloat(document.graphOptions.opacityDiff.value);
	if(opacity >= 0 && opacity <= 1){
		generateGraph();
	}
});

generateGraph();


function generateGraph(){
	d3.select("svg.graph").remove();
	
	// Select the distribution.
	for (var i = 0; i < document.graphOptions.distro.length; i++) {
		if (document.graphOptions.distro[i].checked) {
			var distroType = document.graphOptions.distro[i].value;
		}
	}
	
	// Select the data set.
	var dataSet;
	for (i = 0; i < document.graphOptions.dataSet.length; i++) {
		if (document.graphOptions.dataSet[i].checked) {
			dataSet = document.graphOptions.dataSet[i].value;
		}
	}
	
	var data;
	var stdDevs;
	var isUserData = false;
	switch(dataSet){
		case "data1":
			data = data1;
			break;
		case "data2":
			data = data2;
			break;
		case "user":
			isUserData = true;
			data = [];
			stdDevs = [];
			var dataPoints = $('#user-data').val().replace(' ','').split(';');
			for(i = 0; i < dataPoints.length; i++){
				var dataPoint = dataPoints[i].split(',');
				if(dataPoint.length !== 2){
					break;
				}
				var pointMean = parseFloat(dataPoint[0]);
				var pointStdDev = parseFloat(dataPoint[1]);
				if(pointMean !== NaN && pointStdDev !== NaN){
					data.push(pointMean);
					stdDevs.push(Math.abs(pointStdDev));
				}
			}
			break;
	}
	
	if(!isUserData){
		// Select the standard deviation data set.
		var stdDevSet;
		for (i = 0; i < document.graphOptions.stdDevs.length; i++) {
			if (document.graphOptions.stdDevs[i].checked) {
				 stdDevSet = document.graphOptions.stdDevs[i].value;
			}
		}
		switch(stdDevSet){
			case "stdDevs1":
				stdDevs = stdDevs1;
				break;
			case "stdDevs2":
				stdDevs = stdDevs2;
				break;
			case "stdDevs3":
				stdDevs = stdDevs3;
				break;
		}
	}
	
	var distribution;
	switch(distroType){
		case "normal":
			distribution = new normalDistribution();
			break;
		case "hypSec":
			distribution = new hypSecDistribution();
			break;
		case "triangular":
			var triangularPeak = parseFloat($('#triangular-peak').val());
			distribution = new triangularDistribution(triangularPeak);
			break;
		case "uniform":
			distribution = new uniformDistribution();
			break;
		case "exponential":
			distribution = new exponentialDistribution();
			// If we have exponential distributions, overwrite the standard deviations
			// with the actual values, because they may not be independently set.
			stdDevs = data;
			break;
	}
	
	// We'll choose between "dot", "bar", and "line".
	// Line will take some more SVG/CSS wizardry to implement properly.
	var graphType;
	var displayDistribution;
	for (i = 0; i < document.graphOptions.type.length; i++) {
		if (document.graphOptions.type[i].checked) {
			 graphType = document.graphOptions.type[i].value;
		}
	}
	if(graphType == "dot"){
		displayDistribution = distribution;
	}
	else if(graphType == "bar"){
		displayDistribution = distribution.antiderivative;
	}
	else if(graphType == "line"){
		// Not implemented yet.
		// displayDistribution = distribution;
	}
	
	var keepScale = document.graphOptions.scale.checked;
	var startFromZero = document.graphOptions.startFromZero.checked;
	
	if(maxDisplayValue === -Infinity || !keepScale)
	{
		maxDisplayValue = -Infinity;
		minDisplayValue = Infinity;
		
		if(graphType == "bar" && displayDistribution.translatesWithMean){
			for(i = 0; i < data.length; i++){
				if(data[i] + (displayDistribution.endX - distribution.mean)
				/distribution.standardDeviation*stdDevs[i] > maxDisplayValue){
					maxDisplayValue = data[i] + (displayDistribution.endX - distribution.mean)
						/distribution.standardDeviation*stdDevs[i];
				}
			}
			minDisplayValue = 0;
		}
		else if(displayDistribution.translatesWithMean){
			for(i = 0; i < data.length; i++){
				if(data[i] + (displayDistribution.endX - distribution.mean)
				/distribution.standardDeviation*stdDevs[i] > maxDisplayValue){
					maxDisplayValue = data[i] + (displayDistribution.endX - distribution.mean)
						/distribution.standardDeviation*stdDevs[i];
				}
				if(data[i] + (displayDistribution.startX - distribution.mean)
				/distribution.standardDeviation*stdDevs[i] < minDisplayValue){
					minDisplayValue = data[i] + (displayDistribution.startX - distribution.mean)
					/distribution.standardDeviation*stdDevs[i];
				}
			}
		}
		else if(displayDistribution.scalesWithMean){
			// Note that stdDevs are never used because there's only one parameter for these distros.
			// TODO: Support negative values.
			for(i = 0; i < data.length; i++){
				if(data[i]*displayDistribution.endX > maxDisplayValue){
					maxDisplayValue = data[i]*displayDistribution.endX;
				}
			}
			minDisplayValue = 0;
		}
		// If startFromZero and the graph doesn't span the x-axis,
		// we'll make either the top or bottom of the graph 0.
		if(startFromZero){
			if(minDisplayValue > 0){
				minDisplayValue = 0;
			}
			else if(maxDisplayValue < 0){
				maxDisplayValue = 0;
			}
		}
	}
	
	// This is the vertical size of the display area, in terms of data value.
	var dataRange = maxDisplayValue - minDisplayValue;
	var maxValue = Math.max.apply(Math, data);
	var minValue = Math.min.apply(Math, data);
	
	// Set up scales
	var yScale = d3.scale.linear()
		.domain([minDisplayValue, maxDisplayValue])
		.range([verticalDataPixels, 0]);
	
	// Define the Y axis
	// TODO: make the X-axis this way
	var yAxis = d3.svg.axis()
					.scale(yScale)
					.tickSize(-w + leftMargin, 0)
					.orient("left")
					.ticks(20);
	
	// This is so we can scale the opacity down for data points with large
	// standard deviations, so total color mass is the same for each data point.
	// In the case that the difference in magnitude between the lowest and
	// highest stddevs is large, this will cause the large bands to be too pale.
	// So, we calculate a minimum stddev for the purposes of normalizing opacity.
	var minOpacity = parseFloat(document.graphOptions.opacityDiff.value);
	var minStdDev = Math.max.apply(Math, stdDevs)/Math.min.apply(Math, stdDevs) > 1.0/minOpacity
					? Math.max.apply(Math, stdDevs) * minOpacity
					: Math.min.apply(Math, stdDevs);
	
	//Create SVG element
	var svg = d3.select("body")
				.append("svg")
				.attr("class","graph")
				.attr("width", w)
				.attr("height", h);

	var distributionGradient = svg.append("svg:defs")
	  .append("svg:linearGradient")
		.attr("id", "distribution")
		.attr("x1", "0%")
		.attr("y1", "100%")
		.attr("x2", "0%")
		.attr("y2", "0%")
		.attr("spreadMethod", "pad");

	var subGradients = 100;
	var showBands = $('#showBands').is(':checked');
	var numBands = parseInt($('#numBands').val());
	if(!numBands || numBands < 1){
		numBands = 5;
	}
	var xValues = [];
	var densityValues = [];
	
	for(i = 0; i <= subGradients; i++){
		xValues[i] = displayDistribution.startX + displayDistribution.widthInSDs()
						* distribution.standardDeviation* i / subGradients;
		densityValues[i] = displayDistribution.value(xValues[i]);
	}
	var densityMax = Math.max.apply(Math, densityValues);
	
	var barColor = "#049";
	var epsilon = 1 / (2 * numBands);
	for(i = 0; i <= subGradients; i++){
		// TODO: Implement Ramer–Douglas–Peucker algorithm for more efficient interpolation
		// of density function when implementing separate gradients for each data point.
		var opacity = (graphType == "bar")
			? 1 - densityValues[i] / densityMax
			: densityValues[i] / densityMax;
			
		if(showBands){
			if(opacity < epsilon){
				opacity = 0;
			}
			opacity = Math.ceil(numBands * (opacity - epsilon)) / numBands;
		}
		
		distributionGradient.append("svg:stop")
		.attr("offset", (100 / subGradients) * i + "%")
		.attr("stop-color", barColor)
		.attr("stop-opacity", opacity);
	}
	
	// To look decent, bars must be at least one full pixel for uniform distro,
	// three pixels for others. Due to sampling only one point, single-px nonuniform
	// bars can disappear.
	var minHeight = (distroType == "uniform") ? 1 : 3;
	
	//Create Y axis
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(40,0)")
		.call(yAxis);

	// Make the data bars
	svg.selectAll("rect.graph_gradient")
	   .data(data)
	   .enter()
	   
	   .append("rect")
	   .attr("class","graph_gradient")
	   .attr("x", function(d, i) {
			return leftMargin + i * ((w - leftMargin)/ data.length);
	   })
	   .attr("y", function(d, i) {
			// two basic behaviors: scaling or translating
			if(displayDistribution.translatesWithMean){
				return verticalPositionOfDatum(
					d + (displayDistribution.endX - distribution.mean)/distribution.standardDeviation*stdDevs[i],
					minDisplayValue, maxDisplayValue, verticalDataPixels);
			}
			else if(displayDistribution.scalesWithMean){
				return verticalPositionOfDatum(d * displayDistribution.widthInSDs(),
					minDisplayValue, maxDisplayValue, verticalDataPixels);
			}
		})
	   .attr("width", (w - leftMargin) / data.length - barPadding)
	   .attr("height", function(d, i) {
			var top = undefined;
			var bottom = undefined;
			if(graphType == "bar" && displayDistribution.translatesWithMean){
				top = verticalPositionOfDatum(d + displayDistribution.widthInSDs()*stdDevs[i],
							minDisplayValue, maxDisplayValue, verticalDataPixels);
				bottom = verticalPositionOfDatum(d, minDisplayValue, maxDisplayValue, verticalDataPixels);
			}
			else if(displayDistribution.translatesWithMean){
				top = verticalPositionOfDatum(d + displayDistribution.widthInSDs()*stdDevs[i],
							minDisplayValue, maxDisplayValue, verticalDataPixels);
				bottom = verticalPositionOfDatum(d, minDisplayValue, maxDisplayValue, verticalDataPixels);
			}
			else if(displayDistribution.scalesWithMean){
				top = verticalPositionOfDatum(d * displayDistribution.widthInSDs(),
					minDisplayValue, maxDisplayValue, verticalDataPixels);
				bottom = verticalPositionOfDatum(0, minDisplayValue, maxDisplayValue, verticalDataPixels);
			}
			
			return (bottom - top < minHeight) ? minHeight : bottom - top;
		})
		.style("fill", "url(#distribution)")
		.style("opacity", function(d, i) {
			if(graphType == "bar" && displayDistribution.translatesWithMean){
				return 1;
			}
			else if(displayDistribution.translatesWithMean){
				return Math.min(1, minStdDev / stdDevs[i]);
			}
			else if(displayDistribution.scalesWithMean){
				return Math.min(1, minValue / d);
			}
		});
	
	// Make the solid bottom part of the data bars.
	// An ugly consequence of reusing the gradient.
	if(graphType == "bar" && displayDistribution.translatesWithMean){
		svg.selectAll("rect.graph_solid_bar")
		   .data(data)
		   .enter()
		   
		   .append("rect")
		   .attr("class","graph_solid_bar")
		   .attr("x", function(d, i) {
				return leftMargin + i * ((w - leftMargin)/ data.length);
			})
		   .attr("y", function(d, i) {
				// -1 to ensure no gap due to antialiasing
				return -1 + verticalPositionOfDatum(d + (displayDistribution.startX - distribution.mean)
					/distribution.standardDeviation*stdDevs[i], minDisplayValue, maxDisplayValue, verticalDataPixels);
			})
			.attr("width", (w - leftMargin) / data.length - barPadding)
			.attr("height", function(d, i) {
				return Math.max(0, 1 + verticalPositionOfDatum(0, minDisplayValue, maxDisplayValue, verticalDataPixels)
				- verticalPositionOfDatum(d + (displayDistribution.startX - distribution.mean)
					/distribution.standardDeviation*stdDevs[i], minDisplayValue, maxDisplayValue, verticalDataPixels));
			})
			.style("fill", barColor);
	}
	
	// Make a background white box under the text.
	svg.append("rect")
		.attr("class", "background")
		.attr("x", leftMargin + 1)
		.attr("y", verticalDataPixels + 1)
		.attr("width", w - leftMargin)
		.attr("height", h - verticalDataPixels - 1);
	
	// Put in the text for the x-axis labels.
	svg.selectAll("text.x-scale")
	   .data(data)
	   .enter()
	   .append("text")
	   .attr("class", "x-scale")
	   .text(function(d, i) {
			return startingX + i * xStep;
	   })
	   .attr("text-anchor", "middle")
	   .attr("x", function(d, i) {
			return leftMargin + i * ((w - leftMargin) / data.length) + ((w - leftMargin) / data.length - barPadding) / 2;
	   })
	   .attr("y", function(d) {
			return h - 30;
	   })
	   .attr("font-family", "sans-serif")
	   .attr("font-size", "11px")
	   .attr("fill", "black");
	   
	svg.selectAll("text.x-scale")
		.append('tspan')
		.attr("class", "stats")
		.attr("x", function(d, i) {
			return leftMargin + i * ((w - leftMargin) / data.length) + ((w - leftMargin) / data.length - barPadding) / 2;
		})
		.attr("y", function(d, i) {
			return h - 10;
		})
		.attr("fill", "#888888")
		.text(function(d, i) {
			return "σ: " + stdDevs[i];
		})
		.append('tspan')
		.attr("x", function(d, i) {
			return leftMargin + i * ((w - leftMargin) / data.length) + ((w - leftMargin) / data.length - barPadding) / 2;
		})
		.attr("y", function(d, i) {
			return h - 20;
		})
		.text(function(d) {
			return "μ: " + d;
		});
}

function verticalPositionOfDatum(dataValue, windowMin, windowMax, verticalPixels){
	return verticalPixels * (windowMax - dataValue) / (windowMax - windowMin);
}

function erf(x){
	var sign = (x < 0) ? -1 : 1;
	x = Math.abs(x);
	
	var a1 =  0.254829592;
	var a2 = -0.284496736;
	var a3 =  1.421413741;
	var a4 = -1.453152027;
	var a5 =  1.061405429;
	var p  =  0.3275911;
	
	var t = 1.0/(1.0 + p*x);
	var y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
	return sign*y;
}

function sech(x){
	return 2 / (Math.exp(x) + Math.exp(-x));
}
