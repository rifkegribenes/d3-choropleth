// define constants
const svg = d3.select("svg");
const education = d3.map();
const path = d3.geoPath();

// add html for tooltip
d3.select("body")
  .append("div")
  .attr("id", "tooltip");

// render map
const render = (error, us, education) => {
  if (error) throw error;

  // find min and max values
  const edu = {
    min: d3.min(education, d => d.bachelorsOrHigher),
    max: d3.max(education, d => d.bachelorsOrHigher),
  };

  edu.range = d3.range(edu.min, edu.max, (edu.max - edu.min) / 8);

  // initialize scales
  const x = d3.scaleLinear()
      .domain([edu.min, edu.max])
      .rangeRound([600, 860]);

  const color = d3.scaleThreshold()
      .domain(edu.range)
      .range(d3.schemeYlGnBu[9]);

  // initialize legend
  const g = svg.append("g")
      .attr("class", "key")
      .attr("id", "legend")
      .attr("transform", "translate(0,40)");

  // add color blocks
  g.selectAll("rect")
    .data(color.range().map((d) => {
        d = color.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
      }))
    .enter().append("rect")
      .attr("height", 8)
      .attr("x", (d) =>  x(d[0]))
      .attr("width", (d) => x(d[1]) - x(d[0]))
      .attr("fill", (d) => color(d[0]));

  // add labels
  g.append("text")
      .attr("x", x.range()[0])
      .attr("y", -6)
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text("Educational attainment");

  // add ticks
  g.call(d3.axisBottom(x)
      .tickSize(13)
      .tickFormat((x) => `${Math.round(x)}%`)
      .tickValues(color.domain()))
      .select(".domain")
      .remove();

  // find matching county data from education array
  const countyDataCallback = (d, col) => {
    const countyData = education.find((county) => county.fips === d.id);
    if (countyData) {
      // if col = true, return fill color corresponding to ed level
      // otherwise, return ed level for matching county
      return col ? color(countyData.bachelorsOrHigher) : countyData.bachelorsOrHigher;
      // if no matching county, return 0 (or fill color for 0)
    } else {
      return col ? color(0) : 0;
    }
  }

  // show tooltip
  const showTip = (d, data) => {
    d3.select("#tooltip")
      .style("visibility", "visible")
      .style("top", `${d3.event.pageY}px`)
      .style("left", `${d3.event.pageX + 20}px`)
      .attr("data-education", () => education.find(county => county.fips === d.id).bachelorsOrHigher)
      .html(() => `<span class="tip-name">${data.area_name}, ${data.state}</span><br><span class="tip-mass">${data.bachelorsOrHigher}%</span>`);
  }

  // hide tooltip
  const hideTip = () => {
    d3.select("#tooltip")
      .style("visibility", "hidden")
  }

  // add county data
  svg.append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
      .attr("class", "county")
      .attr("data-fips", (d) => d.id)
      .attr("data-education", (d) => countyDataCallback(d))
      .attr("fill", (d) => countyDataCallback(d, true))
      .attr("d", path)
      // add tooltips
      .on('mouseover', (d) => showTip(d, education.find((county) => county.fips === d.id)))
      .on('mouseout', () => hideTip());

  // add state borders
  svg.append("path")
    .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b ))
    .attr("class", "state")
    .attr("d", path);
}

// load data
d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json")
    .defer(d3.json, "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json")
    .await(render);
