import { PlotBuilder, ScatterPlot } from "./models/plot";
import Papa from 'papaparse';

const svgContainer = document.getElementById('svgContainer');

document.getElementById('csvInput')!.addEventListener('change', (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  Papa.parse(file, {
    complete: (results: { data: string[][] }) => {
      const rawData = results.data as string[][];
      const points: [number, number][] = rawData
        .filter(row => row.length >= 2 && !isNaN(Number(row[0])) && !isNaN(Number(row[1])))
        .map(row => [Number(row[0]), Number(row[1])]);

      const plotSVG = new PlotBuilder()
        .scatterPlot({ points })
        .trendline(0, 'linear').build().render()
      svgContainer!.innerHTML = plotSVG;
    }
  })
})