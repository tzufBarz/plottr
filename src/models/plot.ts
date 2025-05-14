const svgBuilder = require('svg-builder');
const { writeFileSync } = require('fs');
const regression = require('regression');

export function createScatterPlot(
  points: [number, number][],
  width = 500,
  height = 500,
  padding = 40,
  intervalX = 2, // Interval for X-axis labels
  intervalY = 2,  // Interval for Y-axis labels
  trendline = true
): void {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);

  const minX = Math.min(0, ...xs);
  const maxX = Math.max(0, ...xs);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(0, ...ys);

  const plotWidth = width - 2 * padding;
  const plotHeight = height - 2 * padding;

  const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX)) * plotWidth;
  const scaleY = (y: number) => height - padding - ((y - minY) / (maxY - minY)) * plotHeight;

  let svg = svgBuilder.width(width).height(height);

  // Background
  svg = svg.rect({
    x: 0,
    y: 0,
    width,
    height,
    fill: '#222'
  });

  const gridColor = 'white';
  const gridOpacity = 0.1;

  // Vertical grid lines (X-axis)
  for (let x = minX; x <= maxX; x += intervalX) {
    const xPos = scaleX(x);
    if (xPos >= padding && xPos <= width - padding) {
      svg = svg.line({
        x1: xPos,
        y1: padding,
        x2: xPos,
        y2: height - padding,
        stroke: gridColor,
        'stroke-width': 1,
        'stroke-opacity': gridOpacity
      });
    }
  }

  // Horizontal grid lines (Y-axis)
  for (let y = minY; y <= maxY; y += intervalY) {
    const yPos = scaleY(y);
    if (yPos >= padding && yPos <= height - padding) {
      svg = svg.line({
        x1: padding,
        y1: yPos,
        x2: width - padding,
        y2: yPos,
        stroke: gridColor,
        'stroke-width': 1,
        'stroke-opacity': gridOpacity
      });
    }
  }

  // X-axis
  if (minY <= 0 && maxY >= 0) {
    const yZero = scaleY(0);
    svg = svg.line({
      x1: padding,
      y1: yZero,
      x2: width - padding,
      y2: yZero,
      stroke: 'white',
      'stroke-width': 1
    });

    // X-axis labels
    for (let x = minX; x <= maxX; x += intervalX) {
      const xPos = scaleX(x);
      if (xPos >= padding && xPos <= width - padding) { // Check bounds
        svg = svg.text({
          x: xPos,
          y: yZero + 15, // Space below the axis
          fill: 'white',
          'font-size': 12,
          'text-anchor': 'middle'
        }, `${x}`);
      }
    }
  }

  // Y-axis
  if (minX <= 0 && maxX >= 0) {
    const xZero = scaleX(0);
    svg = svg.line({
      x1: xZero,
      y1: padding,
      x2: xZero,
      y2: height - padding,
      stroke: 'white',
      'stroke-width': 1
    });

    // Y-axis labels
    for (let y = minY; y <= maxY; y += intervalY) {
      const yPos = scaleY(y);
      if (yPos >= padding && yPos <= height - padding) { // Check bounds
        svg = svg.text({
          x: xZero - 15, // Space to the left of the axis
          y: yPos,
          fill: 'white',
          'font-size': 12,
          'text-anchor': 'middle',
        }, `${y}`);
      }
    }
  }

  // Points
  for (const [x, y] of points) {
    svg = svg.circle({
      cx: scaleX(x),
      cy: scaleY(y),
      r: 4,
      fill: 'white'
    });
  }

  if (trendline) {
    const data = points;
    const result = regression.linear(data, { order: 2 });

    const numSteps = 200; // more steps = smoother curve
    const stepSize = (maxX - minX) / numSteps;

    const smoothPoints: [number, number][] = [];
    for (let i = 0; i <= numSteps; i++) {
      const x = minX + i * stepSize;
      const [_, y] = result.predict(x); // returns [x, y]
      smoothPoints.push([x, y]);
    }

    const trendPoints = result.points; // Array of [x, y] for the curve
    for (let i = 0; i < trendPoints.length - 1; i++) {
    const [x1, y1] = trendPoints[i];
    const [x2, y2] = trendPoints[i + 1];

    for (let i = 0; i < smoothPoints.length - 1; i++) {
      const [x1, y1] = smoothPoints[i];
      const [x2, y2] = smoothPoints[i + 1];
    
      svg = svg.line({
        x1: scaleX(x1),
        y1: scaleY(y1),
        x2: scaleX(x2),
        y2: scaleY(y2),
        stroke: 'orange',
        'stroke-width': 2
      });
    }    
  }

  }

  const svgContent = svg.render();
  writeFileSync('output/plot.svg', svgContent);
}
