let currentScene = 0;
let data = [];

const margin = { top: 40, right: 50, bottom: 60, left: 80 };
const width = 860 - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;

const colors = {
    Private4Year: "#e63946",
    Public4Year: "#457b9d",
    Public2Year: "#2a9d8f"
};

const labels = {
    Private4Year: "Private 4-Year",
    Public4Year: "Public 4-Year",
    Public2Year: "Public 2-Year"
};

const scenes = [
    {
        title: "The Big Picture: College Costs Have Soared Since 1971",
        description: "After adjusting for inflation, college tuition has risen dramatically over the past 50+ years. Private 4-year institutions have seen the steepest increases, rising from about $14,500 to $45,000 in constant 2025 dollars. Hover over data points to explore specific values.",
        yearRange: [1971, 2025],
        highlight: null,
        annotations: [
            {
                note: { title: "Private 4-Year", label: "+210% since 1971" },
                data: { year: 2010, series: "Private4Year" },
                dx: -40, dy: -40
            },
            {
                note: { title: "Public 4-Year", label: "+249% since 1971" },
                data: { year: 2005, series: "Public4Year" },
                dx: 40, dy: -50
            }
        ]
    },
    {
        title: "The Great Acceleration: 1980-2010",
        description: "Between 1980 and 2010, tuition growth accelerated sharply. Private 4-year tuition nearly tripled in real terms, while public 4-year tuition more than tripled. This 30-year period saw the fastest sustained increases across all institution types.",
        yearRange: [1980, 2010],
        highlight: [1980, 2010],
        annotations: [
            {
                note: { title: "Private 4-Year", label: "$14,150 → $39,530\n(+179%)" },
                data: { year: 1995, series: "Private4Year" },
                dx: -30, dy: -40
            }
        ]
    },
    {
        title: "A Plateau? Recent Trends (2015-2025)",
        description: "Since 2015, tuition growth has stalled and even slightly declined in real terms for public institutions. Public 4-year tuition peaked around 2015 and has dropped about 7% since then. Private 4-year costs remain near all-time highs but have leveled off. Explore the data points to see exact figures.",
        yearRange: [2015, 2025],
        highlight: [2015, 2025],
        annotations: [
            {
                note: { title: "Private peak", label: "$46,370 in 2020" },
                data: { year: 2020, series: "Private4Year" },
                dx: -50, dy: -35
            },
            {
                note: { title: "Public 4-Year decline", label: "Down ~7% from 2015 peak" },
                data: { year: 2023, series: "Public4Year" },
                dx: 50, dy: -40
            }
        ]
    }
];

d3.select("#btn-next").on("click", function() {
    if (currentScene < scenes.length - 1) {
        currentScene++;
        renderScene();
    }
});

d3.select("#btn-prev").on("click", function() {
    if (currentScene > 0) {
        currentScene--;
        renderScene();
    }
});

d3.csv("data/tuition.csv").then(function(raw) {
    data = raw.map(d => ({
        year: +d.Year,
        Private4Year: +d.Private4Year,
        Public4Year: +d.Public4Year,
        Public2Year: +d.Public2Year
    }));
    buildLegend();
    renderScene();
});

function buildLegend() {
    const legend = d3.select("#legend");
    Object.keys(colors).forEach(key => {
        const item = legend.append("div").attr("class", "legend-item");
        item.append("div").attr("class", "legend-swatch")
            .style("background-color", colors[key]);
        item.append("span").text(labels[key]);
    });
}

function renderScene() {
    const scene = scenes[currentScene];

    d3.select("#btn-prev").property("disabled", currentScene === 0);
    d3.select("#btn-next").property("disabled", currentScene === scenes.length - 1);
    d3.select("#scene-indicator").text(`Scene ${currentScene + 1} of ${scenes.length}`);
    d3.select("#scene-title").text(scene.title);
    d3.select("#scene-description").text(scene.description);

    d3.select("#chart").html("");
    d3.selectAll(".tooltip").remove();

    const filteredData = data.filter(d => d.year >= scene.yearRange[0] && d.year <= scene.yearRange[1]);

    const xPadding = (scene.yearRange[1] - scene.yearRange[0]) * 0.03;
    const x = d3.scaleLinear()
        .domain([scene.yearRange[0] - xPadding, scene.yearRange[1] + xPadding])
        .range([0, width]);

    const yMax = d3.max(filteredData, d => Math.max(d.Private4Year, d.Public4Year, d.Public2Year));
    const y = d3.scaleLinear()
        .domain([0, yMax * 1.1])
        .range([height, 0]);

    const svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(filteredData.length > 10 ? 10 : filteredData.length));

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => `$${d3.format(",")(d)}`));

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", -height / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Tuition & Fees (2025 Dollars)");

    if (scene.highlight) {
        svg.append("rect")
            .attr("x", x(scene.highlight[0]))
            .attr("y", 0)
            .attr("width", x(scene.highlight[1]) - x(scene.highlight[0]))
            .attr("height", height)
            .attr("fill", "#fffbe6")
            .attr("stroke", "#e6c200")
            .attr("stroke-dasharray", "4,2")
            .attr("opacity", 0.5);
    }

    const series = ["Private4Year", "Public4Year", "Public2Year"];

    series.forEach(key => {
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d[key]));

        const path = svg.append("path")
            .datum(filteredData)
            .attr("fill", "none")
            .attr("stroke", colors[key])
            .attr("stroke-width", 2.5)
            .attr("d", line);

        const totalLength = path.node().getTotalLength();
        path.attr("stroke-dasharray", totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(1200)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        svg.selectAll(`.dot-${key}`)
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", `dot-${key}`)
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d[key]))
            .attr("r", 4)
            .attr("fill", colors[key])
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .style("opacity", 0)
            .transition()
            .delay(1200)
            .duration(300)
            .style("opacity", 1);
    });

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    series.forEach(key => {
        svg.selectAll(`.overlay-${key}`)
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d[key]))
            .attr("r", 8)
            .attr("fill", "transparent")
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(150).style("opacity", 1);
                tooltip.html(`<strong>${labels[key]}</strong><br>Year: ${d.year}<br>Tuition: $${d3.format(",")(d[key])}`)
                    .style("left", (event.pageX + 12) + "px")
                    .style("top", (event.pageY - 30) + "px");
                d3.select(this).attr("r", 10).attr("fill", colors[key]).attr("opacity", 0.3);
            })
            .on("mouseout", function() {
                tooltip.transition().duration(150).style("opacity", 0);
                d3.select(this).attr("r", 8).attr("fill", "transparent");
            });
    });

    if (scene.annotations && typeof d3.annotation === "function") {
        const annotations = scene.annotations.map(a => {
            const point = filteredData.find(d => d.year === a.data.year);
            if (!point) return null;
            return {
                note: a.note,
                x: x(a.data.year),
                y: y(point[a.data.series]),
                dx: a.dx,
                dy: a.dy,
                color: "#333",
                type: d3.annotationCalloutElbow
            };
        }).filter(a => a !== null);

        const makeAnnotations = d3.annotation()
            .annotations(annotations);

        svg.append("g")
            .attr("class", "annotation-group")
            .style("opacity", 0)
            .call(makeAnnotations)
            .transition()
            .delay(1300)
            .duration(500)
            .style("opacity", 1);
    }
}
