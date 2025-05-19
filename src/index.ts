import { PlotBuilder, ScatterPlot } from "./models/plot";
import Papa from 'papaparse';

const svgContainer = document.getElementById('svgContainer');

document.getElementById('csvInput')!.addEventListener('change', (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  Papa.parse(file, {
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
        builder.scatterPlot({ points, title: data[0][yKey] } as ScatterPlot)
        // .trendline(i, "polynomial", { order: 2 });
        i++;
      }

      builder.setXTitle(data[0]["x"]);

      const svg = builder.build().render();

      svgContainer!.innerHTML = svg;
    }
  })
})