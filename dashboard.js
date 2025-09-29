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

let chart1, chart2, chart3, chart4;

let selectedPrimary = "study_hours_per_day";
let selectedSecondary = "sleep_hours";
let currentFilteredData = currentData;

const categoricalGroupings = {
  study_hours_per_day: (v) =>
    v < 2 ? "Low Study" : v < 5 ? "Medium Study" : "High Study",
  sleep_hours: (v) =>
    v < 5 ? "Low Sleep" : v < 8 ? "Normal Sleep" : "High Sleep",

  gender: (v) => v,
  diet_quality: (v) => v,
  internet_quality: (v) => v,
  part_time_job: (v) => v,
};

function initDashboard(_data) {
  width = 600;
  height = 380;
  createDropdowns();

  chart1 = d3
    .select("#chart1")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");
  chart2 = d3
    .select("#chart2")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");
  chart3 = d3
    .select("#chart3")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");
  chart4 = d3
    .select("#chart4")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

  createChart1();
  createChart2(currentData);
  createChart3(currentData);
  createChart4();
}

function createDropdowns() {
  const selectorDiv = d3
    .select("#chart1")
    .insert("div", ":first-child")
    .attr("id", "sunburst-dropdowns")
    .style("padding-bottom", "10px");
  selectorDiv.html("");

  const options = Object.keys(categoricalGroupings);

  selectorDiv.append("label").text("Primary Grouping: ");
  selectorDiv
    .append("select")
    .attr("id", "primaryGrouping")
    .on("change", function () {
      selectedPrimary = this.value;
      refreshCharts();
    })
    .selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .property("selected", (d) => d === selectedPrimary)
    .text((d) => d);

  selectorDiv.append("label").text(" Secondary Grouping: ");
  selectorDiv
    .append("select")
    .attr("id", "secondaryGrouping")
    .on("change", function () {
      selectedSecondary = this.value;
      refreshCharts();
    })
    .selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .property("selected", (d) => d === selectedSecondary)
    .text((d) => d);
}

function refreshCharts() {
  clearDashboard();
  createChart1();
  createChart2(currentData);
  createChart3(currentData);
  createChart4();
}


//sunburst
function createChart1() {
  const hierarchyData = buildSunburstHierarchy(currentData);
  // 2pi for full radiation  (d.value ) represent how many students in each category 
  const radius = Math.min(width, height) / 2;
  const root = d3.hierarchy(hierarchyData).sum((d) => d.value);
  d3.partition().size([2 * Math.PI, radius])(root);

  //define how each arch is drawn 
  const arc = d3
    .arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .innerRadius((d) => d.y0)
    .outerRadius((d) => d.y1);

    //center SVG container 
  chart1.attr("transform", `translate(${width / 2}, ${height / 2})`);

  // 🎨 Paul Tol’s beautiful colorblind-friendly palette
  const categoryColors = {
    "Low Study": "#332288",
    "Medium Study": "#CC6677",
    "Normal Study": "#117733",
    "High Study": "#09746c",
    "Low Sleep": "#DDCC77",
    "Medium Sleep": "#88CCEE",
    "Normal Sleep": "#44AA99",
    "High Sleep": "#EECC66",
  };

  // Tooltip for inactivity 
  const tooltip = d3.select("body").select(".sunburst-tooltip").empty()
    ? d3
        .select("body")
        .append("div")
        .attr("class", "sunburst-tooltip")
        .style("position", "absolute")
        .style("padding", "6px")
        .style("background", "#222")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0)
    : d3.select("body").select(".sunburst-tooltip");

  // Draw arcs
  chart1
    .selectAll("path")
    .data(root.descendants().filter((d) => d.depth))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => categoryColors[d.data.name] || "#44AA99")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .style("cursor", "pointer")
    .style("opacity", 0.9)
    //clic behavior
    .on("click", (event, d) => {
      chart1.selectAll("path").style("opacity", 0.3);
      d3.select(event.currentTarget)
        .style("opacity", 1)
        .style("stroke", "black");

      const students = d
        .descendants()
        .filter((n) => n.data.students)
        .flatMap((n) => n.data.students);

//after finiding all the student data under that segment passes them to handler function 
      handleSunburstSelection(students);
    })
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(`<b>${d.data.name}</b><br/>${d.value} students`)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(300).style("opacity", 0);
    });

  // Add labels only if high enough to prevent overlap
  chart1
    .selectAll("text.label")
    .data(root.descendants().filter((d) => d.depth && d.x1 - d.x0 > 0.1))
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("transform", function (d) {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = (d.y0 + d.y1) / 2;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    })
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .text((d) => d.data.name);
}

//nested hiarchichal data structure for sunburst chart 
function buildSunburstHierarchy(data) {
  const root = { name: "students", children: [] };
  const group1 = d3.groups(data, (d) =>
    categoricalGroupings[selectedPrimary](
      +d[selectedPrimary] || d[selectedPrimary]
    )
  );

  for (const [lvl1, group1Data] of group1) {
    const group2 = d3.groups(group1Data, (d) =>
      categoricalGroupings[selectedSecondary](
        +d[selectedSecondary] || d[selectedSecondary]
      )
    );
    const children = group2.map(([lvl2, students]) => ({
      name: lvl2,
      value: students.length,
      students,
    }));

    root.children.push({ name: lvl1, children });
  }

  return root;
}

//respond to user clickes on sunburst 
function handleSunburstSelection(filteredStudents) {
  currentFilteredData = filteredStudents; // ✅ Track latest filtered data
  clearChart(chart2);
  clearChart(chart3);
  clearChart(chart4);
  createChart2(currentFilteredData);
  createChart3(currentFilteredData);
  createChart4(currentFilteredData);
}

let binCount = 10;

function createChart2(filteredData) {
  //skips rendering if there is no data to show 
  if (!filteredData || filteredData.length === 0) return;

  const margin = { top: 30, right: 30, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = chart2
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
//maps exam score (0-100) to horizontal axis 
  const x = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);
//breaks data into score intervals 
  const histogram = d3
    .histogram()
    .value((d) => +d.exam_score)
    .domain(x.domain())
    .thresholds(x.ticks(binCount));

  const bins = histogram(filteredData);
//calculate y axis ( how many studnets fall into each score bin )
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(bins, (d) => d.length)])
    .nice()
    .range([innerHeight, 0]);

  // X Axis
  svg
    .append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x));

  //draw  Y Axis
  svg.append("g").call(d3.axisLeft(y));

  // draw Bars
  const bars = svg.selectAll("rect").data(bins, (d) => d.x0);

  bars
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.x0) + 1)
    .attr("y", y(0))
    .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr("height", 0)
    .style("fill", "#69b3a2")
    .merge(bars)
    .transition()
    .duration(750)
    .attr("x", (d) => x(d.x0) + 1)
    .attr("y", (d) => y(d.length))
    .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr("height", (d) => innerHeight - y(d.length));

  bars.exit().remove();

  // Title
  svg
    .append("text")
    .attr("x", innerWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Exam Score Distribution");

  // X label
  svg
    .append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 35)
    .attr("text-anchor", "middle")
    .text("Exam Score");

  // Y label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -35)
    .attr("x", -innerHeight / 2)
    .attr("text-anchor", "middle")
    .text("Number of Students");

  // === Make sure the slider updates chart2 live ===
  d3.select("#binSlider").on("input", function () {
    binCount = +this.value;
    d3.select("#binCount").text(binCount);
    clearChart(chart2);
    createChart2(currentFilteredData);
  });
}
//box plot
function createChart3(filteredData = currentData) {
  if (!filteredData || filteredData.length === 0) return;

  const margin = { top: 40, right: 30, bottom: 60, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const category = "internet_quality";

  const svg = chart3
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const grouped = d3.groups(filteredData, (d) => d[category]);

  const x = d3
    .scaleBand()
    .domain(grouped.map(([k]) => k))
    .range([0, innerWidth])
    .padding(0.2);

  const allValues = filteredData.map((d) => +d.exam_score);
  const y = d3
    .scaleLinear()
    .domain([d3.min(allValues), d3.max(allValues)])
    .nice()
    .range([innerHeight, 0]);

  const colorScale = d3.scaleSequential(d3.interpolateYlOrBr).domain([50, 100]); // Adjust as needed

  const tooltip = d3.select("#tooltip");

  svg
    .append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x));

  svg.append("g").call(d3.axisLeft(y));

  grouped.forEach(([group, values]) => {
    const scores = values.map((d) => +d.exam_score).sort(d3.ascending);
    const q1 = d3.quantile(scores, 0.25);
    const q3 = d3.quantile(scores, 0.75);
    const median = d3.quantile(scores, 0.5);
    const min = d3.min(scores);
    const max = d3.max(scores);
    const center = x(group) + x.bandwidth() / 2;

    // Whiskers(vertical line from min to max )
    svg
      .append("line")
      .attr("x1", center)
      .attr("x2", center)
      .attr("y1", y(min))
      .attr("y2", y(max))
      .attr("stroke", "black");

    // Box from Q1 to Q3 colored by median 
    svg
      .append("rect")
      .attr("x", x(group))
      .attr("y", y(q3))
      .attr("width", x.bandwidth())
      .attr("height", 0) // Animate from 0
      .attr("fill", colorScale(median))
      .attr("stroke", "black")
      .on("mouseover", (event) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<b>${group}</b><br/>
             Min: ${min}<br/>
             Q1: ${q1}<br/>
             Median: ${median}<br/>
             Q3: ${q3}<br/>
             Max: ${max}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0))
      .on("click", () => {
        chart3
          .selectAll("rect")
          .style("stroke", "black")
          .style("stroke-width", 1);
        d3.select(event.currentTarget)
          .style("stroke", "#000")
          .style("stroke-width", 3);

        d3.select("#focusPanel").html(
          `<b>Selected Group:</b> ${group}<br/>
           Median Exam Score: ${median.toFixed(1)}`
        );

        clearChart(chart4);
        createChart4(values); // Send selected group to Chart 4
      })
      .on("dblclick", () => {
        clearChart(chart3);
        createChart3(currentData);
        clearChart(chart4);
        d3.select("#focusPanel").html("");
      })
      .transition()
      .duration(800)
      .attr("height", y(q1) - y(q3));

    // Median Line
    svg
      .append("line")
      .attr("x1", x(group))
      .attr("x2", x(group) + x.bandwidth())
      .attr("y1", y(median))
      .attr("y2", y(median))
      .attr("stroke", "black");
  });

  // Chart title and axis labels
  svg
    .append("text")
    .attr("x", innerWidth / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Exam Scores by Internet Quality");

  svg
    .append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 45)
    .attr("text-anchor", "middle")
    .text("Internet Quality");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -innerHeight / 2)
    .attr("text-anchor", "middle")
    .text("Exam Score");
}

function createChart4(filteredData = currentData) {
  if (!filteredData || filteredData.length === 0) return;

  clearChart(chart4);
//categories plotted on the axis of radar chart 
  const metrics = [
    "study_hours_per_day",
    "social_media_hours",
    "netflix_hours",
    "mental_health_rating",
    "attendance_percentage",
    "exam_score",
  ];
//for each metric extract values from data , filter invalid queries , calculate average value 
  const averages = metrics.map((metric) => {
    const values = filteredData.map((d) => +d[metric]).filter((v) => !isNaN(v));
    return { metric, value: d3.mean(values) };
  });
//chart geometry setup 
  const radius = Math.min(width, height) / 2 - 60;
  const levels = 5;
  const angleSlice = (Math.PI * 2) / metrics.length;

  const svg = chart4
    .append("svg")
    .attr("width", width)
    .attr("height", height + 40)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2 + 30})`);

  // Title
  svg
    .append("text")
    .attr("x", 0)
    .attr("y", -radius - 40)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Distraction vs Performance Profile");

  // Circular grid 
  for (let level = 1; level <= levels; level++) {
    const r = (radius / levels) * level;
    svg
      .append("circle")
      .attr("r", r)
      .style("fill", "none")
      .style("stroke", "#ccc")
      .style("stroke-dasharray", "2,2");
  }

  // Axes & labels
  metrics.forEach((metric, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    svg
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", x)
      .attr("y2", y)
      .attr("stroke", "#aaa");

    svg
      .append("text")
      .attr("x", x * 1.15)
      .attr("y", y * 1.15)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .text(metric.replaceAll("_", " "));
  });

  // Normalize values
  const valueExtent = {};
  metrics.forEach((metric) => {
    const allValues = currentData
      .map((d) => +d[metric])
      .filter((v) => !isNaN(v));
    valueExtent[metric] = d3.extent(allValues);
  });
//converts average values to radial distance to normalized sacle 
  const radarLine = d3
    .lineRadial()
    .radius((d) => {
      const [min, max] = valueExtent[d.metric];
      return ((d.value - min) / (max - min)) * radius;
    })
    .angle((d, i) => i * angleSlice)
    .curve(d3.curveLinearClosed);
// draws the closed polygon connecting the average values for each metric 
  svg
    .append("path")
    .datum(averages)
    .attr("d", radarLine)
    .attr("fill", "#FFCC80")
    .attr("stroke", "#FB8C00")
    .attr("stroke-width", 2)
    .attr("fill-opacity", 0.4);
// places a dot at the end of each radar spoke 
  svg
    .selectAll(".radar-dot")
    .data(averages)
    .enter()
    .append("circle")
    .attr("class", "radar-dot")
    //calculate position based on value or angle
    .attr("cx", (d, i) => {
      const [min, max] = valueExtent[d.metric];
      const value = ((d.value - min) / (max - min)) * radius;
      return value * Math.cos(angleSlice * i - Math.PI / 2);
    })
    .attr("cy", (d, i) => {
      const [min, max] = valueExtent[d.metric];
      const value = ((d.value - min) / (max - min)) * radius;
      return value * Math.sin(angleSlice * i - Math.PI / 2);
    })
    .attr("r", 3)
    .attr("fill", "#FB8C00");
}

function clearDashboard() {
  clearChart(chart1);
  clearChart(chart2);
  clearChart(chart3);
  clearChart(chart4);
}

function clearChart(chart) {
  if (chart) chart.selectAll("*").remove();
}
function toggleFullscreen(btn) {
  const chartContainer = btn.closest(".dashboard-container");
  const chartId = chartContainer.querySelector("svg").parentNode.id;
  const modal = document.getElementById("chartModal");
  const modalContent = document.getElementById("modalChartContent");

  // Expand dimensions
  width = 950;
  height = 600;

  // Clear old modal content
  modalContent.innerHTML = `<div id="${chartId}"></div>`;

  // Re-render chart based on id
  if (chartId === "chart1") {
    chart1 = d3
      .select("#" + chartId)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g");

    createChart1(); // or whatever function builds it
  } else if (chartId === "chart2") {
    // Similar for chart2...
  }

  modal.style.display = "block";
}
