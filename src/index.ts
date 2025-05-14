import { PlotBuilder, ScatterPlot } from "./models/plot";
import Papa from 'papaparse';

const svgContainer = document.getElementById('svgContainer');

document.getElementById('csvInput')!.addEventListener('change', (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  Papa.parse(file, {
<<<<<<< HEAD
    header: true,
    complete: (results: { data: Record<string, string>[] }) => {
      const data = results.data as Record<string, string>[];
      const yColumns = Object.keys(data[0]).filter(key => key !== 'x');

      const builder = new PlotBuilder();

      let i = 0;
      for (const yKey of yColumns) {
        const points = data.map(row => ([
          Number(row["x"]),
          Number(row[yKey])
        ])).filter(point => !isNaN(point[0]) && !isNaN(point[1]));
        builder.scatterPlot({ points, color: data[0][yKey] } as ScatterPlot);
        i++;
      }

      const svg = builder.build().render();

      svgContainer!.innerHTML = svg;
=======
    complete: (results: { data: string[][] }) => {
      const rawData = results.data as string[][];
      const points: [number, number][] = rawData
        .filter(row => row.length >= 2 && !isNaN(Number(row[0])) && !isNaN(Number(row[1])))
        .map(row => [Number(row[0]), Number(row[1])]);

      const plotSVG = new PlotBuilder()
        .scatterPlot({ points })
        .trendline(0, 'linear').build().render()
      svgContainer!.innerHTML = plotSVG;
>>>>>>> refs/remotes/origin/main
    }
  })
})