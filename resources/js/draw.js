$(document).ready(function(){
	$.getJSON("automated_economy.json")
	.done(function(data){
		console.log("done");
		drawVis(data);
	})
	.fail(function(data){
		console.log("fail")
	});
});

function drawVis(dataContainer){
	var data = dataContainer.data;
	var $canvas = $("#canvas");
	var h = $canvas.height();
	var w = $canvas.width();
	var FULL_DATA_SET = data;
	var FULL_DATA_SET_LENGTH = data.length;
	var OCCUPATION_MAJOR_GROUPS = $.unique(data.map(function(d){ return d.occupationMajorGroup}));
	var svg = d3.select("#" + $canvas.attr("id"))
		.append("svg")
		.attr("height", h)
		.attr("width", w);
		
	svg.append("text")
		.attr("x",6)
		.attr("y", 30)
		.attr("class", "subTitle")
		.attr("fill", "#333333")
		.text("Job Table")
		
	var yScale = d3.scaleLinear()
		.domain([0,data.length-1])
		.range([175, h-50])
		
	var fontScale = d3.scaleLinear()
		.domain([702, 1])
		.range([8, 32])
		
	var colors = d3.schemeCategory20;
	colors.push("gold");
	colors.push("teal");
		
	var colorScale = d3.scaleOrdinal(colors)
		.domain(data.map(function(d){return d.occupationMajorGroup;}));
	
	var rankFormatter = d3.format("0>3")
	var probabilityFormatter = d3.format("%");
	
	var preview = $("<div>")
		.attr("id","preview")
		.css({
			position: "fixed",
			top: "0px",
			height: "100%",
			width: "30px",
			left: "calc(100% - 30px)"
		})
		
	var previewElements = data.map(function(d){
		return $("<div>")
			.attr("class", "previewElement")
			.prop("occupationMajorGroup", d.occupationMajorGroup)
			.css({
				height: $(window).height()/data.length,
				width: "30px",
				backgroundColor: colorScale(d.occupationMajorGroup),
				opacity: 0
			});
	});
	
	preview.append(previewElements);
	
	$("body").append(preview);
	
	preview[0].update = function(majorOccupation, color){
		$(".previewElement").animate({opacity:0},"fast");
		$(".previewElement").each(function(i,d){
			if($(this).prop("occupationMajorGroup") === majorOccupation){
				$(this).animate({opacity:0.8},"fast");
			}
		});
	}
	preview[0].hide = function(){
		$(".previewElement").animate({opacity:0},"fast");
	};
	
	var searchString = "";
	$("#jobSearch").on("keyup",function(e){
		$(".suggestionsContainer").remove();
		if(e.keyCode == 8 || e.keyCode == 46){
			searchString = $(this).val()
			if(searchString.length > 3){
				$(".controls-panel").append(
					new FilterSuggestions(FULL_DATA_SET)
						.withFilter(searchString)
						.build());
			}
		}else if( e.key.length == 1){
			searchString += e.key;
			if(searchString.length >= 3){
				$(".controls-panel").append(
					new FilterSuggestions(FULL_DATA_SET)
						.withFilter(searchString)
						.build());
			}
		}
		$(".suggestion").click(function(){
			$(".suggestionsContainer").remove()
			var occupation = this.textContent;
			var occupationMajorGroup;
			console.log(occupation);
			var filteredData = FULL_DATA_SET.filter(function(d){
				if(d.occupation == occupation){
					occupationMajorGroup = d.occupationMajorGroup;
					return d;
				}
			});
			updateTable(filteredData, occupationMajorGroup);
		});
	});
	
	$("#jobSearch").change(function(){
		if($(this).val() == ""){
			updateTable(FULL_DATA_SET,null);
		}
	})
	
		
	var jobs = svg.selectAll(".jobs")
		.data(data)
		.enter()
		.append("g")
		.attr("class", "jobGroups")
		.attr("transform", function(d,i){
			return "translate(50, " + yScale(i) + ")";
		})
		.each(function(d){			
			d3.select(this)
				.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("height",22)
				.attr("width",w-100)
				.attr("fill", "silver");
				
			d3.select(this)
				.append("text")
				.attr("class", "jobText")
				.attr("x",10)
				.attr("y", 18)
				.attr("font-size", function(d){
					return 18;
				})
				.text(rankFormatter(d.rank) + " | " + d.occupation + " | " + (d.probability * 100).toFixed(2) + "%");
		})
		.on("click", function(d){
			var currentOccupation = d.occupationMajorGroup;
			var color = colorScale(d.occupationMajorGroup)
			svg.selectAll(".jobGroups")
				.selectAll("rect")
				.transition()
				.attr("fill", function(d){
					if(d.occupationMajorGroup === currentOccupation){
						return color;
					}
					return "silver";
				});
			
			$("#preview").get(0).update(currentOccupation, color);
		});
		
	var majorOccupationGroups = svg.selectAll(".g")
		.data(
			$.unique(
				$.map(data, function(d){
					return d.occupationMajorGroup;})))
		.enter()
		.append("g")
		.attr("class", "legend")
		.attr("transform", function(d,i){
			var x = (Math.floor(i/4) * 200) + 50;
			var y = ((i%4) * 30) + 40;
			return "translate(" + x + ", " + y + ")";
		})
		.each(function(d,i){
			d3.select(this)
				.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("height",24)
				.attr("width",24)
				.attr("fill", colorScale(d));
				
			d3.select(this)
				.append("text")
				.attr("class", "jobText")
				.attr("x",28)
				.attr("y", 19)
				.attr("text-anchor", "start")
				.attr("font-size", function(d){
					return 10;
				})
				.text(d.replace(" Occupations", ""));
		})
		.on("click", function(d,i){
			if(!$(this).prop("filtered") || $(this).prop("filtered") === undefined){
				var clickedOccupation = d;
				var filteredData = data.filter(function(d){
					if(d.occupationMajorGroup === clickedOccupation){
						return d;
					}
				});
				$(".legend").prop("filtered", false);
				$(this).prop("filtered", true);
				updateTable(filteredData, clickedOccupation);
				
			svg.selectAll(".legend")
				.transition()
				.attr("opacity", function(d){
					return d === clickedOccupation ? 1 : 0.3;
				});
			
			}else{
				updateTable(data, d);
				$(".legend").prop("filtered", false);
				
				svg.selectAll(".legend")
					.transition()
					.attr("opacity", 1);
			}			
		});
		
		
		function updateTable(filteredData, occupation){
			
			var jobGroups = svg.selectAll(".jobGroups")
				.data(filteredData, function(d){ return d.occupation });
						
			var animations = {}
			
			animations.exit = {}
			animations.exit.duration = 300;
			animations.exit.delay = 0;
			
			animations.update = {}
			animations.update.duration = 500;
			animations.update.delay = jobGroups._exit.length === 0 ? 0 : animations.exit.duration;
			
			animations.enter = {};
			animations.enter.duration = 300;
			animations.enter.delay = function(){
				var delay = 0;
				jobGroups._exit.length > 0 ? delay += animations.exit.duration : delay += 0;
				jobGroups._groups.length !== jobGroups._enter.length ? delay += animations.update.duration : delay += 0;
				return delay;
			};
			
			jobGroups.exit()
				.transition()
				.duration(animations.exit.duration)
				.delay(animations.exit.delay)
				.attrTween("transform", function(d,index){
					var node = this;
					var y = parseFloat(
						$(node)
							.attr("transform")
							.replace(/translate\(\d+,\s*(\d+\.{0,}\d*)\)/g, "$1"));
					var i = d3.interpolateNumber(50, -200);
					return function(t){
						return "translate(" + i(t) + "," + y + ")";
					}
				})
				.remove();
			
			var enter = jobGroups.enter()
				.append("g")
				.attr("class", "jobGroups")
				.attr("transform", function(d,i){
					return "translate(200, " + yScale(i) + ")";
				})
				.each(function(d){			
					var g = d3.select(this)
					var rect = g.selectAll(".rect")
						.data([d])
						.enter()
						.append("rect")
						.attr("height",22)
						.attr("width",w-100)
						.attr("x", 0)
						.attr("y", 0)
						.attr("fill", "rgba(255, 255, 255, 0)")
						.transition()
						.duration(animations.enter.duration)
						.delay(animations.enter.delay)
						.attr("fill",function(d){
							return filteredData.length === FULL_DATA_SET_LENGTH ? "silver" : colorScale(d.occupationMajorGroup);
						});
												
					d3.select(this)
						.append("text")
						.attr("class", "jobText")
						.attr("x",10)
						.attr("y", 18)
						.attr("font-size", function(d){
							return 18;
						})
						.text(rankFormatter(d.rank) + " | " + d.occupation + " | " + (d.probability * 100).toFixed(2) + "%")
						.attr("opacity", 0)
						.transition()
						.duration(animations.enter.duration)
						.delay(animations.enter.delay)
						.attr("opacity", 1);
				});
			
			enter.transition()
				.duration(animations.enter.duration)
				.delay(animations.enter.delay)
				.attrTween("transform", function(d,index){
					var node = this;
					var y = parseFloat(
						$(node)
							.attr("transform")
							.replace(/translate\(\d+,\s*(\d+\.{0,}\d*)\)/g, "$1"));
					var i = d3.interpolateNumber(200, 50);
					return function(t){
						return "translate(" + i(t) + "," + y + ")";
					}
				})
				
			
				
			jobGroups
				.transition()
				.duration(animations.update.duration)
				.attrTween("transform", function(d,index){
					var node = this;
					var y = parseFloat($(node).attr("transform").replace(/translate\(\d+,\s*(\d+\.{0,}\d*)\)/g, "$1"));
					var i = d3.interpolateNumber(y, yScale(index));
					return function(t){
						return "translate(50, " + i(t) + ")";
					}
				})
				.select("rect")
				.attr("fill",function(d){ return occupation !== null ? colorScale(d.occupationMajorGroup) : "silver"; })
				.select("text")
				.attr("opacity", 0)
				.transition()
				.attr("opacity", 1)
				.text(function(d){
					return rankFormatter(d.rank) + " | " + d.occupation + " | " + (d.probability * 100).toFixed(2) + "%";
				});
				
			if(filteredData.length === FULL_DATA_SET_LENGTH){
				var color = occupation !== null ? colorScale(occupation) : "silver";
				console.log(color);
				console.log(occupation);
				$("#preview").get(0).update(occupation, color);
			}else{
				$("#preview").get(0).hide();
			}
			
				
				
			jobGroups.on("click", null);
			svg.selectAll(".jobGroups").on("click", function(d){
				var currentOccupation = d.occupationMajorGroup;
				var color = colorScale(d.occupationMajorGroup)
				svg.selectAll(".jobGroups")
					.selectAll("rect")
					.transition()
					.attr("fill", function(d){
						if(d.occupationMajorGroup === currentOccupation){
							return color;
						}
						return "silver";
					});
				
				$("#preview").get(0).update(currentOccupation, color);
			});
		}
}

var FilterSuggestions = function(data){
	var _this = this;
	var suggestionBox = $("<div>")
		.attr("class", "suggestionsContainer");
	
	var occupations = data.map(function(d){
		return $("<div>")
			.attr("class", "suggestion")
			.text(d.occupation);
	});
	
	var suggestions = null;
	_this.withFilter = function(searchTerm){
		suggestions = null;
		suggestions = occupations.filter(function(d){
			if(d.get(0).textContent.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1){
				return d;
			}
		});
		return this;
	};
	
	_this.build = function(){
		suggestionBox.append(suggestions);
		return suggestionBox;
	};
	
	return _this;	
}
