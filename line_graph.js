var TABLE_DATA = {};
var SECTION1_DATA = [];
var SECTION2_DATA = [];
var OVERALL_DATA = [];

async function fetchData() {
  try {
    const response = await fetch('fetch_data.php');

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    TABLE_DATA = await response.json();

    // Filter and map data into 2D arrays [TimeRecorded, WaterUsed]
    SECTION1_DATA = TABLE_DATA
      .filter(data => data.Location === "Section 1")
      .map(data => [data.TimeRecorded, data.WaterUsed]);

    SECTION2_DATA = TABLE_DATA
      .filter(data => data.Location !== "Section 1")
      .map(data => [data.TimeRecorded, data.WaterUsed]);

    // Parse the time after the data is fetched
    var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    SECTION1_DATA = SECTION1_DATA.map(function (d) {
      return [parseTime(d[0]), d[1]];
    });
    SECTION2_DATA = SECTION2_DATA.map(function (d) {
      return [parseTime(d[0]), d[1]];
    });

    // Combine Section 1 and Section 2 data for Overall Data
    OVERALL_DATA = SECTION1_DATA.map((h1, index) => {
      return [h1[0], h1[1] + (SECTION2_DATA[index] ? SECTION2_DATA[index][1] : 0)];
    });

    // After fetching, draw the initial graph
    drawGraph(OVERALL_DATA, "Overall Water Consumption");
  } catch (error) {
    console.error(error);
  }
}

fetchData(); // Fetch the data at the start

// SVG and margin setup
var svg = d3.select("svg"),
  margin = { top: 50, right: 50, bottom: 70, left: 70 },
  width = svg.attr("width") - margin.left - margin.right,
  height = svg.attr("height") - margin.top - margin.bottom;

var xScale = d3.scaleTime().range([0, width]),
  yScale = d3.scaleLinear().range([height, 0]);

var g = svg
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function drawGraph(data, title) {
  g.selectAll("*").remove(); // Clear previous content
  svg.selectAll("text").remove(); // Clear previous titles

  xScale.domain(d3.extent(data, function (d) { return d[0]; }));
  yScale.domain([0, d3.max(data, function (d) { return d[1]; })]);

  // Background
  g.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "white");

  // Title
  svg
    .append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", 20)
    .style("font-weight", "bold")
    .text(title);

  // X label
  svg
    .append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", height + margin.top + margin.bottom / 2 + 10)
    .attr("text-anchor", "middle")
    .style("font-size", 18)
    .style("font-weight", "bold")
    .text("Time");

  // Y label
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr(
      "transform",
      "translate(" +
      (margin.left / 2 - 20) +
      "," +
      (height / 2 + margin.top) +
      ")rotate(-90)"
    )
    .style("font-size", 18)
    .style("font-weight", "bold")
    .text("Water Consumption");

  // Axis configuration
  var timeSpan = d3.extent(data, function (d) { return d[0]; });
  var xAxis =
    timeSpan[1] - timeSpan[0] <= 24 * 60 * 60 * 1000
      ? d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%H:%M:%S"))
      : d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%Y-%m-%d"));
  var yAxis = d3.axisLeft(yScale);

  g.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  g.append("g").call(yAxis);

  g.selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", function (d) { return xScale(d[0]); })
    .attr("cy", function (d) { return yScale(d[1]); })
    .attr("r", 3)
    .style("fill", "#64748b");

  // Add line path
  var line = d3
    .line()
    .x(function (d) { return xScale(d[0]); })
    .y(function (d) { return yScale(d[1]); })
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line)
    .style("fill", "none")
    .style("stroke", "#64748b")
    .style("stroke-width", "2");

  // Add hover feature
  var focus = g.append("g").style("display", "none");

  focus.append("circle").attr("r", 4.5).style("fill", "#64748b");

  focus.append("rect")
    .attr("class", "tooltip")
    .attr("height", 50)
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("fill", "black");

  focus.append("rect")
    .attr("class", "tooltip-date-bg")
    .attr("height", 25)
    .attr("fill", "black");

  focus.append("rect")
    .attr("class", "tooltip-value-bg")
    .attr("height", 25)
    .attr("y", 25)
    .attr("fill", "black");

  focus.append("text")
    .attr("class", "tooltip-date")
    .attr("y", 18)
    .attr("fill", "white");

  focus.append("text")
    .attr("class", "tooltip-value")
    .attr("y", 43)
    .attr("fill", "white");

  svg.append("rect")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", function () { focus.style("display", null); })
    .on("mouseout", function () { focus.style("display", "none"); })
    .on("mousemove", mousemove);

  function mousemove() {
    var x0 = xScale.invert(d3.mouse(this)[0]),
      i = bisectDate(data, x0, 1),
      d0 = data[i - 1],
      d1 = data[i],
      d = x0 - d0[0] > d1[0] - x0 ? d1 : d0;

    focus.attr("transform", "translate(" + xScale(d[0]) + "," + yScale(d[1]) + ")");

    var formatDate = d3.timeFormat("%B %d, %Y %H:%M:%S");
    var dateText = "Date: " + formatDate(d[0]);
    var valueText = "Water Used: " + d[1];

    focus.select(".tooltip-date").text(dateText);
    focus.select(".tooltip-value").text(valueText);

    var dateWidth = focus.select(".tooltip-date").node().getComputedTextLength();
    var valueWidth = focus.select(".tooltip-value").node().getComputedTextLength();
    var maxWidth = Math.max(dateWidth, valueWidth) + 20;

    focus.select("rect.tooltip").attr("width", maxWidth);
    focus.select("rect.tooltip-date-bg").attr("width", maxWidth);
    focus.select("rect.tooltip-value-bg").attr("width", maxWidth);

    var xPosition = xScale(d[0]) + 10 > width - maxWidth ? -maxWidth - 10 : 10;
    focus.selectAll("rect.tooltip, rect.tooltip-date-bg, rect.tooltip-value-bg")
      .attr("x", xPosition);

    focus.selectAll(".tooltip-date, .tooltip-value")
      .attr("x", xPosition + 5);
  }

  var bisectDate = d3.bisector(function (d) { return d[0]; }).left;
}

// Ensure that the event listeners are added only once and that they trigger the correct sequence
document.getElementById("loadData").addEventListener("click", function () {
  fetchData().then(() => {
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    this.classList.add("active");
    drawGraph(OVERALL_DATA, "Overall Water Consumption");
  });
});

document.getElementById("loadNode1").addEventListener("click", function () {
  fetchData().then(() => {
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    this.classList.add("active");
    drawGraph(SECTION1_DATA, "Section 1 Water Consumption");
  });
});

document.getElementById("loadNode2").addEventListener("click", function () {
  fetchData().then(() => {
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    this.classList.add("active");
    drawGraph(SECTION2_DATA, "Section 2 Water Consumption");
  });
});