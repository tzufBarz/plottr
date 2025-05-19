import { PlotBuilder, ScatterPlot, RegressionMethod } from "./models/plot";
import Papa from 'papaparse';

const svgContainer = document.getElementById('svgContainer');

const builder = new PlotBuilder();

let yColumns: string[];

document.getElementById('csvInput')!.addEventListener('change', (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    complete: (results: { data: Record<string, string>[] }) => {

      const data = results.data as Record<string, string>[];
      yColumns = Object.keys(data[0]).filter(key => key !== 'x');

      for (const yKey of yColumns) {
        const points = data.map(row => ([
          Number(row["x"]),
          Number(row[yKey])
        ])).filter(point => !isNaN(point[0]) && !isNaN(point[1]));
        builder.scatterPlot({ points, title: data[0][yKey] } as ScatterPlot)
      }

      builder.setXTitle(data[0]["x"]);

      updatePlot();
    }
  })
})

function updatePlot() {
  const svg = builder.build().render();
  svgContainer!.innerHTML = svg;
}

document.getElementById('saveButton')?.addEventListener('click', () => {
  const blob = new Blob([svgContainer!.innerHTML]);
  const element = document.createElement('a');
  element.download = `${prompt("Enter File Name: ")}.svg`;
  element.href = window.URL.createObjectURL(blob);
  element.click();
  element.remove();
});

const regressionInput = document.getElementById('regressionInput') as HTMLSelectElement;

Object.values(RegressionMethod).forEach(method => {
  const option = document.createElement('option');
  option.value = method;
  option.textContent = method;
  regressionInput.appendChild(option);
});

regressionInput.addEventListener('change', (event) => {
  const selectedMethod = (event.target as HTMLSelectElement).value as RegressionMethod;
  yColumns.forEach((_, plotI) => {
    builder.setTrendline(plotI, selectedMethod || null);
  });

  updatePlot();
});