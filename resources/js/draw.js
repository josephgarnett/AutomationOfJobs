$(document).ready(function(){
	$.getJSON("automated_economy.json")
	.done(function(data){
		console.log("done");
		drawVis(data);
	})
	.fail(function(data){
		console.log("fail")
	})
	.always(function(data){
		console.log(data);
	});
});

function drawVis(dataContainer){
	var data = dataContainer.data;
	var $canvas = $("#canvas");
	var h = $canvas.height();
	var w = $canvas.width();
	var FULL_DATA_SET = data;
	
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
		.range([50, h-50])
		
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
				.attr("width",993)
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
			return "translate(1200, " + (yScale(i) + i*6) + ")";
		})
		.each(function(d,i){
			d3.select(this)
				.append("rect")
				.attr("x", 196)
				.attr("y", 0)
				.attr("height",24)
				.attr("width",24)
				.attr("fill", colorScale(d));
				
			d3.select(this)
				.append("text")
				.attr("class", "jobText")
				.attr("x",190)
				.attr("y", 19)
				.attr("text-anchor", "end")
				.attr("font-size", function(d){
					return 12;
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
				updateTable(filteredData);
				
			svg.selectAll(".legend")
				.transition()
				.attr("opacity", function(d){
					return d === clickedOccupation ? 1 : 0.3;
				});
			
			}else{
				updateTable(data);
				$(".legend").prop("filtered", false);
				
				svg.selectAll(".legend")
					.transition()
					.attr("opacity", 1);
			}			
		});
		
		
		function updateTable(filteredData){
			var jobGroups = svg.selectAll(".jobGroups")
				.data(filteredData);
															
			jobGroups.exit()
				.transition()
				.attr("transform", function(d,i){
					return "translate(0, " + yScale(i) + ")";
				})
				.attr("opacity", 0)
				.remove();
			
			jobGroups.enter()
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
						.attr("width",993)
						.attr("fill", filteredData.length === FULL_DATA_SET.length ? "silver" : colorScale(d.occupationMajorGroup));
						
					d3.select(this)
						.append("text")
						.attr("class", "jobText")
						.attr("x",10)
						.attr("y", 18)
						.attr("font-size", function(d){
							return 18;
						})
						.text(rankFormatter(d.rank) + " | " + d.occupation + " | " + (d.probability * 100).toFixed(2) + "%");
				});
				
			jobGroups
				.select("text")
				.attr("opacity", 0)
				.transition()
				.attr("opacity", 1)
				.text(function(d){
					return rankFormatter(d.rank) + " | " + d.occupation + " | " + (d.probability * 100).toFixed(2) + "%";
				});
				
			jobGroups
				.select("rect")
				.transition()
				.duration(100)
				.attr("fill", function(d){ return filteredData.length === FULL_DATA_SET.length ? "silver" : colorScale(d.occupationMajorGroup);})
				
			jobGroups.on("click", null);
			jobGroups.on("click", function(d){
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