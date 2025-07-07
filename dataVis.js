/*
* Data Visualization - Framework
* Copyright (C) University of Passau
*   Faculty of Computer Science and Mathematics
*   Chair of Cognitive sensor systems
* Maintenance:
*   2025, Alexander Gall <alexander.gall@uni-passau.de>
*
* All rights reserved.
*/

// scatterplot axes
let xAxis, yAxis, xAxisLabel, yAxisLabel;
// radar chart axes
let radarAxes, radarAxesAngle;

let dimensions = ["dimension 1", "dimension 2", "dimension 3", "dimension 4", "dimension 5", "dimension 6"];
//*HINT: the first dimension is often a label; you can simply remove the first dimension with
// dimensions.splice(0, 1);

// the visual channels we can use for the scatterplot
let channels = ["scatterX", "scatterY", "size"];

// size of the plots
let margin, width, height, radius;
// svg containers
let scatter, radar, dataTable;

// Add additional variables


function init() {
    // define size of plots
    margin = {top: 20, right: 20, bottom: 20, left: 50};
    width = 600;
    height = 500;
    radius = width / 2;

    // Start at default tab
    document.getElementById("defaultOpen").click();

	// data table
	dataTable = d3.select('#dataTable');
 
    // scatterplot SVG container and axes
    scatter = d3.select("#sp").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    // radar chart SVG container and axes
    radar = d3.select("#radar").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

    // read and parse input file
    let fileInput = document.getElementById("upload"), readFile = function () {

        // clear existing visualizations
        clear();

        let reader = new FileReader();
        reader.onloadend = function () {
            console.log("data loaded: ");
            console.log(reader.result);

// TODO: parse reader.result data and call the init functions with the parsed data!

            // Parse CSV data
            let parsedData = d3.csvParse(reader.result);
           
            // Call visualization functions with parsed data
            initVis(parsedData);
            CreateDataTable(parsedData);
            
            // TODO: possible place to call the dashboard file for Part 2
            initDashboard(parsedData);
        };
        reader.readAsBinaryString(fileInput.files[0]);
    };
    fileInput.addEventListener('change', readFile);
}


function initVis(_data){

    // TODO: parse dimensions (i.e., attributes) from input file
    dimensions = Object.keys(_data[0]);

    // Remove the first dimension if it's a label
    dimensions.splice(0, 1);

    console.log("Parsed dimensions:", dimensions);


    // y scalings for scatterplot
    // TODO: set y domain for each dimension
    let y = d3.scaleLinear()
        .range([height - margin.bottom - margin.top, margin.top]);

    // x scalings for scatter plot
    // TODO: set x domain for each dimension
    let x = d3.scaleLinear()
        .range([margin.left, width - margin.left - margin.right]);

    // radius scalings for radar chart
    // TODO: set radius domain for each dimension
    let r = d3.scaleLinear()
        .range([0, radius]);

    // scatterplot axes
    yAxis = scatter.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ")")
        .call(d3.axisLeft(y));

    yAxisLabel = yAxis.append("text")
        .style("text-anchor", "middle")
        .attr("y", margin.top / 2)
        .text("x");

    xAxis = scatter.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0, " + (height - margin.bottom - margin.top) + ")")
        .call(d3.axisBottom(x));

    xAxisLabel = xAxis.append("text")
        .style("text-anchor", "middle")
        .attr("x", width - margin.right)
        .text("y");

    // radar chart axes
    radarAxesAngle = Math.PI * 2 / dimensions.length;
    let axisRadius = d3.scaleLinear()
        .range([0, radius]);
    let maxAxisRadius = 0.75,
        textRadius = 0.8;
    gridRadius = 0.1;

    // radar axes
    radarAxes = radar.selectAll(".axis")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "axis");

    radarAxes.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", function(d, i){ return radarX(axisRadius(maxAxisRadius), i); })
        .attr("y2", function(d, i){ return radarY(axisRadius(maxAxisRadius), i); })
        .attr("class", "line")
        .style("stroke", "black");

    // TODO: render grid lines in gray

    // TODO: render correct axes labels
    radar.selectAll(".axisLabel")
        .data(dimensions)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", function(d, i){ return radarX(axisRadius(textRadius), i); })
        .attr("y", function(d, i){ return radarY(axisRadius(textRadius), i); })
        .text("dimension");

    // init menu for the visual channels
    channels.forEach(function(c){
        initMenu(c, dimensions);
    });

    // refresh all select menus
    channels.forEach(function(c){
        refreshMenu(c);
    });

    renderScatterplot();
    renderRadarChart();
}

// clear visualizations before loading a new file
function clear(){
    scatter.selectAll("*").remove();
    radar.selectAll("*").remove();
    dataTable.selectAll("*").remove();
}

//Create Table
function CreateDataTable(_data) {

    // TODO: create table and add class
    let table = dataTable.append("table").attr("class","dataTableClass")

    // TODO: add headers, row & columns
    let headers = Object.keys(_data[0]);
    let thead = table.append("thead").append("tr");
    headers.forEach(header => {
        thead.append("th").attr("class", "dataTableHeader").text(header);
    });

    let tbody =table.append("tbody");
    _data.forEach(row => {
        let tr = tbody.append("tr");
        headers.forEach(header => {
            tr.append("td").attr("class", "dataTableCell").text(row[header]);
        });
        // TODO: add mouseover event
        tr.on("mouseover", function () {
            d3.select(this).style("background-color", "lightblue"); // Highlight row
        }).on("mouseout", function () {
            d3.select(this).style("background-color", "white"); // Reset row color
        });
    });
    
}
function renderScatterplot(){

    // TODO: get domain names from menu and label x- and y-axis
    let xDimension = readMenu("scatterX");
    let yDimension = readMenu("scatterY");
    let sizeDimension = readMenu("size");
    // TODO: re-render axes
    // Set x-axis domain based on the selected dimension
    let x = d3.scaleLinear()
        .domain(d3.extent(parsedData, d => +d[xDimension])) // Get min and max values for xDimension
        .range([margin.left, width - margin.right]);

    // Set y-axis domain based on the selected dimension
    let y = d3.scaleLinear()
        .domain(d3.extent(parsedData, d => +d[yDimension])) // Get min and max values for yDimension
        .range([height - margin.bottom, margin.top]);

    // TODO: render dots

    // Set size domain for the dots
    let r = d3.scaleLinear()
        .domain(d3.extent(parsedData, d => +d[sizeDimension])) // Get min and max values for sizeDimension
        .range([2, 10]); // Set minimum and maximum radius for dots

    // Re-render x-axis
    xAxis.call(d3.axisBottom(x));
    xAxisLabel.text(xDimension);

    // Re-render y-axis
    yAxis.call(d3.axisLeft(y));
    yAxisLabel.text(yDimension);

    // Render dots
    let dots = scatter.selectAll(".dot")
        .data(parsedData);

    // Enter new dots
        dots.enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(+d[xDimension])) // Position based on xDimension
        .attr("cy", d => y(+d[yDimension])) // Position based on yDimension
        .attr("r", d => r(+d[sizeDimension])) // Size based on sizeDimension
        .style("fill", "steelblue")
        .style("opacity", 0.7);

    // Update existing dots
    dots.attr("cx", d => x(+d[xDimension]))
        .attr("cy", d => y(+d[yDimension]))
        .attr("r", d => r(+d[sizeDimension]));

    // Remove old dots
    dots.exit().remove();

}

function renderRadarChart(){

    // TODO: show selected items in legend
    // Define a color scale for unique colors
    let colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Render polylines for each data item
    let radarLines = radar.selectAll(".radarLine")
        .data(parsedData);

    // Enter new polylines
    radarLines.enter()
        .append("path")
        .attr("class", "radarLine")
        .attr("d", function(d) {
            return d3.line()
                .x((_, i) => radarX(axisRadius(+d[dimensions[i]]), i))
                .y((_, i) => radarY(axisRadius(+d[dimensions[i]]), i))
                .curve(d3.curveLinear)(dimensions);
        })
        .style("fill", "none")
        .style("stroke", (d, i) => colorScale(i)) // Assign unique color
        .style("stroke-width", 2);

    // Update existing polylines
    radarLines.attr("d", function(d) {
            return d3.line()
                .x((_, i) => radarX(axisRadius(+d[dimensions[i]]), i))
                .y((_, i) => radarY(axisRadius(+d[dimensions[i]]), i))
                .curve(d3.curveLinear)(dimensions);
        })
        .style("stroke", (d, i) => colorScale(i));

    // Remove old polylines
    radarLines.exit().remove();

    // TODO: render polylines in a unique color
    // Render legend for selected items
    let legend = radar.selectAll(".legend")
        .data(parsedData);

    // Enter new legend items
    legend.enter()
        .append("text")
        .attr("class", "legend")
        .attr("x", width / 2 + radius + 20) // Position legend outside the radar chart
        .attr("y", (_, i) => i * 20) // Space out legend items vertically
        .text(d => d[dimensions[0]]) // Use the first dimension as the label
        .style("fill", (d, i) => colorScale(i))
        .style("font-size", "12px");

    // Update existing legend items
    legend.text(d => d[dimensions[0]])
        .style("fill", (d, i) => colorScale(i));

    // Remove old legend items
    legend.exit().remove();
}


function radarX(radius, index){
    return radius * Math.cos(radarAngle(index));
}

function radarY(radius, index){
    return radius * Math.sin(radarAngle(index));
}

function radarAngle(index){
    return radarAxesAngle * index - Math.PI / 2;
}

// init scatterplot select menu
function initMenu(id, entries) {
    $("select#" + id).empty();

    entries.forEach(function (d) {
        $("select#" + id).append("<option>" + d + "</option>");
    });

    $("#" + id).selectmenu({
        select: function () {
            renderScatterplot();
        }
    });
}

// refresh menu after reloading data
function refreshMenu(id){
    $( "#"+id ).selectmenu("refresh");
}

// read current scatterplot parameters
function readMenu(id){
    return $( "#" + id ).val();
}

// switches and displays the tabs
function openPage(pageName,elmnt,color) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }
    document.getElementById(pageName).style.display = "block";
    elmnt.style.backgroundColor = color;
}
