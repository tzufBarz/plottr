import { PlotBuilder, ScatterPlot } from "./models/plot";
import { writeFileSync } from "fs";

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

writeFileSync('out/plot.svg',
    new PlotBuilder().scatterPlot(plot1).scatterPlot(plot2).trendline(0, 'polynomial', { order: 2 }).trendline(1, 'linear').build().render()
);