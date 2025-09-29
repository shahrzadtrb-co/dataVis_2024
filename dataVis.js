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

let dimensions = [
  "dimension 1",
  "dimension 2",
  "dimension 3",
  "dimension 4",
  "dimension 5",
  "dimension 6",
];

let currentData = [];
let selectedStudents = [];
let studentColors = new Map();
let colorScale = d3.scaleOrdinal(d3.schemeCategory10); // up to 10 colors
//*HINT: the first dimension is often a label; you can simply remove the first dimension with
// dimensions.splice(0, 1);
// the visual channels we can use for the scatterplot
let idKey = "student_id";
let channels = ["scatterX", "scatterY", "size"];

// size of the plots
let margin, width, height, radius;
// svg containers
let scatter, radar, dataTable;
// Add additional variables
// ... (keep everything else the same above)
function init() {
  // define size of plots
  margin = { top: 20, right: 20, bottom: 20, left: 50 };
  width = 600;
  height = 500;
  radius = width / 2;
  document.getElementById("defaultOpen").click();

  dataTable = d3.select("#dataTable");

  scatter = d3
    .select("#sp")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

  radar = d3
    .select("#radar")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  let fileInput = document.getElementById("upload");

  fileInput.addEventListener("change", function () {
    clear();

    let reader = new FileReader();
    reader.onloadend = function () {
      let parsedData = d3.csvParse(reader.result);

      // ✅ Normalize keys (spaces to underscores, lowercase)
      parsedData = parsedData.map((d) => {
        const cleaned = {};
        for (const key in d) {
          const newKey = key.trim().toLowerCase().replaceAll(" ", "_");
          cleaned[newKey] = d[key];
        }
        return cleaned;
      });

      // ✅ Add unique IDs and labels
      const allKeys = Object.keys(parsedData[0]);
      const labelKey = allKeys.find((k) => isNaN(+parsedData[0][k])) || "row";

      parsedData = parsedData.map((d, i) => ({
        ...d,
        uid: `${labelKey}_${i}`,
        _label: d[labelKey] || `row_${i}`,
      }));

      currentData = parsedData;
      idKey = "uid";

      console.log("Normalized keys:", Object.keys(parsedData[0]));
      console.log("Parsed data sample:", parsedData[0]);

      // Extract numeric dimensions
      const allNumericKeys = Object.keys(parsedData[0]).filter(
        (key) => !isNaN(+parsedData[0][key])
      );

      dimensions = allNumericKeys;

      initVis(parsedData);
      CreateDataTable(parsedData);
      initDashboard(parsedData);
    };

    reader.readAsText(fileInput.files[0]);
  });
}

function initVis(_data) {
  // Store the data globally for reuse in other charts
  currentData = _data;
  // Scales for scatterplot axes
  let y = d3
    .scaleLinear()
    .range([height - margin.bottom - margin.top, margin.top]);
  let x = d3
    .scaleLinear()
    .range([margin.left, width - margin.left - margin.right]);
  let r = d3.scaleLinear().range([0, radius]);
  // Scatterplot Axes Setup
  yAxis = scatter
    .append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + margin.left + ")")
    .call(d3.axisLeft(y));

  yAxisLabel = yAxis
    .append("text")
    .style("text-anchor", "middle")
    .attr("y", margin.top / 2)
    .text("x");

  xAxis = scatter
    .append("g")
    .attr("class", "axis")
    .attr(
      "transform",
      "translate(0," + (height - margin.bottom - margin.top) + ")"
    )
    .call(d3.axisBottom(x));

  xAxisLabel = xAxis
    .append("text")
    .style("text-anchor", "middle")
    .attr("x", width - margin.right)
    .text("y");
  // Radar chart setup
  radarAxesAngle = (Math.PI * 2) / dimensions.length;
  let axisRadius = d3.scaleLinear().range([0, radius]);
  let maxAxisRadius = 0.75;
  let textRadius = 0.8;
  // Draw radar gridlines (5 concentric circles)
  for (let i = 1; i <= 5; i++) {
    let level = (i / 5) * radius * maxAxisRadius;
    radar
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", level)
      .style("fill", "none")
      .style("stroke", "#ccc")
      .style("stroke-width", 0.5);
  }
  // Radar axes lines
  radarAxes = radar
    .selectAll(".axis")
    .data(dimensions)
    .enter()
    .append("g")
    .attr("class", "axis");

  radarAxes
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", function (d, i) {
      return radarX(axisRadius(maxAxisRadius), i);
    })
    .attr("y2", function (d, i) {
      return radarY(axisRadius(maxAxisRadius), i);
    })
    .attr("class", "line")
    .style("stroke", "black");
  // Radar axis labels
  radar
    .selectAll(".axisLabel")
    .data(dimensions)
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("x", function (d, i) {
      return radarX(axisRadius(textRadius), i);
    })
    .attr("y", function (d, i) {
      return radarY(axisRadius(textRadius), i);
    })
    .text((d) => d);
  // Initialize dropdown menus with numeric dimensions
  channels.forEach((c) => initMenu(c, dimensions));
  channels.forEach((c) => refreshMenu(c));
  // Render visualizations
  renderScatterplot();
  renderRadarChart();
}
// clear visualizations before loading a new file
function clear() {
  scatter.selectAll("*").remove();
  radar.selectAll("*").remove();
  dataTable.selectAll("*").remove();
}
//Create Table
function CreateDataTable(_data) {
  // Clear previous table
  dataTable.selectAll("*").remove();
  // Create table
  const table = dataTable.append("table").attr("class", "dataTableClass");
  // Create header
  const header = table.append("thead").append("tr");
  Object.keys(_data[0]).forEach((col) => {
    header.append("th").attr("class", "tableHeaderClass").text(col);
  });
  // Create body
  const rows = table
    .append("tbody")
    .selectAll("tr")
    .data(_data)
    .enter()
    .append("tr");

  rows
    .selectAll("td")
    .data((d) => Object.values(d))
    .enter()
    .append("td")
    .attr("class", "tableBodyClass")
    .text((d) => d);
  // Optional: highlight on hover
  // rows
  //   .on("mouseover", function () {
  //     d3.select(this).style("background-color", "#e0f7fa");
  //   })
  //   .on("mouseout", function () {
  //     d3.select(this).style("background-color", null);
  //   });
  // TODO: create table and add class
  // TODO: add headers, row & columns
  // TODO: add mouseover event
}

function renderScatterplot() {
  // TODO: get domain names from menu and label x- and y-axis
  // TODO: re-render axes
  // TODO: render dots
  // Read selected dimensions from dropdown menus

  let xAttr = readMenu("scatterX");
  let yAttr = readMenu("scatterY");
  let sizeAttr = readMenu("size");

  const xValues = currentData.map((d) => +d[xAttr]).filter((v) => !isNaN(v));
  const yValues = currentData.map((d) => +d[yAttr]).filter((v) => !isNaN(v));
  const sizeValues = currentData
    .map((d) => +d[sizeAttr])
    .filter((v) => !isNaN(v));

  const xExtent = d3.extent(xValues);
  const yExtent = d3.extent(yValues);

  // No padding: exactly fit domain to data range
  const xScale = d3
    .scaleLinear()
    .domain(xExtent)
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain(yExtent)
    .range([height - margin.bottom, margin.top]);

  const sizeScale = d3
    .scaleLinear()
    .domain(d3.extent(sizeValues))
    .range([4, 12]);

  // Update axes
  xAxis
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .transition()
    .duration(500)
    .call(d3.axisBottom(xScale));

  yAxis
    .attr("transform", `translate(${margin.left}, 0)`)
    .transition()
    .duration(500)
    .call(d3.axisLeft(yScale));

  // Update axis labels (optional)
  xAxisLabel
    .attr("x", width / 2)
    .attr("y", 40)
    .text(xAttr);

  yAxisLabel
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .text(yAttr);

  // Bind data to circles
  let circles = scatter.selectAll("circle").data(currentData, (d) => d[idKey]);

  // ENTER new circles
  circles
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => xScale(+d[xAttr]))
    .attr("cy", (d) => yScale(+d[yAttr]))
    .attr("r", 0)
    .style("fill", (d) =>
      isSelected(d) ? colorScale(getStudentIndex(d)) : "#444"
    )
    .style("stroke", "#111")
    .style("stroke-width", 0.4)
    .style("opacity", 0.6)
    .on("click", function (event, d) {
      toggleSelection(d);
      renderScatterplot();
      renderRadarChart();
    })
    // 🆕 Hover events for tooltip
    .on("mouseover", function (event, d) {
      const tooltipHtml = `
      <strong>${d._label}</strong><br>
      ${dimensions.map((dim) => `<b>${dim}:</b> ${d[dim]}`).join("<br>")}
    `;
      d3.select("#tooltip").style("opacity", 1).html(tooltipHtml);
      d3.select(this).transition().duration(200).attr("r", 10); // Enlarge point
    })
    .on("mousemove", function (event) {
      d3.select("#tooltip")
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      d3.select("#tooltip").style("opacity", 0);
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", (d) => sizeScale(+d[sizeAttr])); // Reset point size
    })
    .merge(circles)
    .transition()
    .duration(800)
    .attr("cx", (d) => xScale(+d[xAttr]))
    .attr("cy", (d) => yScale(+d[yAttr]))
    .attr("r", (d) => sizeScale(+d[sizeAttr]))
    .style("fill", function (d) {
      const index = getStudentIndex(d);
      return index >= 0 ? colorScale(index) : "#444";
    });

  // EXIT old circles
  circles.exit().remove();
}

function renderRadarChart() {
  // Clear old elements
  radar.selectAll(".radar-line").remove();
  radar.selectAll(".radar-dot").remove();
  d3.select("#legend").selectAll("*").remove();

  if (selectedStudents.length === 0) return;

  // 1. Normalize dimensions per axis
  const minMax = {};
  dimensions.forEach((dim) => {
    minMax[dim] = d3.extent(currentData, (d) => +d[dim]);
  });

  const axisScales = {};
  dimensions.forEach((dim) => {
    axisScales[dim] = d3
      .scaleLinear()
      .domain(d3.extent(currentData, (d) => +d[dim]))
      .range([0, radius * 0.75]);
  });

  const radarLine = d3
    .line()
    .x((d) => radarX(axisScales[d.dimension](d.value), d.index))
    .y((d) => radarY(axisScales[d.dimension](d.value), d.index))
    .curve(d3.curveLinearClosed);

  selectedStudents.forEach((student, i) => {
    const color = studentColors.get(student[idKey]);

    // 2. Prepare normalized values
    const values = dimensions.map((dim, j) => ({
      dimension: dim,
      value: +student[dim],
      index: j,
    }));

    // 3. Draw radar path
    radar
      .append("path")
      .datum(values)
      .attr("class", "radar-line")
      .attr("d", radarLine)
      .style("stroke", color)
      .style("fill", "none")
      .style("stroke-width", 2)
      .style("opacity", 0.9);

    // 4. Draw dots correctly at corner of shape (adjust angle -Math.PI/2!)
    values.forEach((d, idx) => {
      radar
        .append("circle")
        .attr("class", "radar-dot")
        .attr("cx", radarX(axisScales[d.dimension](d.value), d.index))
        .attr("cy", radarY(axisScales[d.dimension](d.value), d.index))
        .attr("r", 4)
        .style("fill", color)
        .style("stroke", "#fff")
        .style("stroke-width", 1.2);
    });

    // 5. Legend
    const legendItem = d3
      .select("#legend")
      .append("div")
      .style("margin", "4px");

    legendItem
      .append("span")
      .attr("class", "color-circle")
      .style("background-color", color);

    legendItem.append("span").text(student._label);

    legendItem
      .append("span")
      .attr("class", "close")
      .text("x")
      .on("click", () => {
        selectedStudents.splice(i, 1);
        studentColors.delete(student[idKey]);
        renderScatterplot();
        renderRadarChart();
      });
  });
}

function isSelected(d) {
  return selectedStudents.some((s) => s[idKey] === d[idKey]);
}

function toggleSelection(d) {
  const index = selectedStudents.findIndex((s) => s[idKey] === d[idKey]);
  if (index > -1) {
    selectedStudents.splice(index, 1);
    studentColors.delete(d[idKey]); //
  } else if (selectedStudents.length < 10) {
    selectedStudents.push(d);
    if (!studentColors.has(d[idKey])) {
      const assignedColors = Array.from(studentColors.values());
      const availableColors = d3.schemeCategory10.filter(
        (c) => !assignedColors.includes(c)
      );
      const color =
        availableColors.length > 0
          ? availableColors[0]
          : d3.schemeCategory10[assignedColors.length % 10];
      studentColors.set(d[idKey], color);
    }
  }
}

function getStudentIndex(d) {
  return selectedStudents.findIndex((s) => s[idKey] === d[idKey]);
}
function radarX(r, i) {
  return r * Math.cos(radarAngle(i));
}

function radarY(r, i) {
  return r * Math.sin(radarAngle(i));
}

function radarAngle(index) {
  return ((Math.PI * 2) / dimensions.length) * index - Math.PI / 2;
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
    },
  });
}
// refresh menu after reloading data
function refreshMenu(id) {
  $("#" + id).selectmenu("refresh");
}
// read current scatterplot parameters
function readMenu(id) {
  return $("#" + id).val();
}
// switches and displays the tabs
function openPage(pageName, elmnt, color) {
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
