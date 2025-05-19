"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plot_1 = require("./models/plot");
const fs_1 = require("fs");
var plot1 = {
    points: [
        [0, 0],
        [1, 1],
        [2, 4],
        [3, 9],
    ]
};
var plot2 = {
    points: [
        [-4, 0],
        [1, 2],
        [3, 3]
    ],
    color: 'red'
};
(0, fs_1.writeFileSync)('out/plot.svg', new plot_1.PlotBuilder().scatterPlot(plot1).scatterPlot(plot2).trendline(0, 'polynomial', { order: 2 }).trendline(1, 'linear').build().render());
