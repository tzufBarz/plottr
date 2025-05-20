import { PlotBuilder, ScatterPlot, RegressionMethod } from "./models/plot";
import Papa from 'papaparse';
import './style.css';

const svgContainer = document.getElementById('svgContainer');

let builder: PlotBuilder;

let yColumns: string[];

document.getElementById('csvInput')!.addEventListener('change', (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    complete: (results: { data: Record<string, string>[] }) => {
      builder = new PlotBuilder();

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
  const regressionMethod = (regressionMethodInput as HTMLSelectElement).value as RegressionMethod;
  const regressionOrder = parseInt(regressionOrderInput.value);

  yColumns.forEach((_, plotI) => {
    builder.setTrendline(plotI, regressionMethod || null, { order: regressionOrder });
  });

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

const regressionMethodInput = document.getElementById('regressionMethodInput') as HTMLSelectElement;
const regressionOrderInput = document.getElementById('regressionOrderInput') as HTMLInputElement;

Object.values(RegressionMethod).forEach(method => {
  const option = document.createElement('option');
  option.value = method;
  option.textContent = method;
  regressionMethodInput.appendChild(option);
});

regressionMethodInput.addEventListener('change', updatePlot);
regressionOrderInput.addEventListener('input', updatePlot);