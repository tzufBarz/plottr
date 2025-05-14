import { PlotBuilder, ScatterPlot } from "./models/plot";

var plot1: ScatterPlot = {
    points: [
        [0, 0],
        [1, 1],
        [2, 4],
        [3, 9],
    ]
}

var plot2: ScatterPlot = {
    points: [
        [-4, 0],
        [1, 2],
        [3, 3]
    ],
    color: 'red'
}

const parser = new DOMParser();

const plot = new PlotBuilder().scatterPlot(plot1).scatterPlot(plot2).trendline(0, 'polynomial', { order: 2 }).trendline(1, 'linear').build().render()

var doc = parser.parseFromString(plot, 'image/svg+xml');

document.body.appendChild(doc.documentElement);