const svgBuilder = require('svg-builder');
const regression = require('regression');

type RegressionMethod = 'linear' | 'polynomial' | 'exponential' | 'logarithmic' | 'power';
export type ScatterPlot = { points: [number, number][], color?: string };

export class PlotBuilder {
  private width: number = 800;
  private height: number = 600;
  private padding: number = 40;
  private intervalX: number = 1;
  private intervalY: number = 1;

  private minX: number = 0;
  private maxX: number = 0;
  private minY: number = 0;
  private maxY: number = 0;
  private plotWidth: number = this.width - 2 * this.padding;
  private plotHeight: number = this.height - 2 * this.padding;

  private scatterPlots: ScatterPlot[] = [];
  private trendlines: { plotI: number, method: RegressionMethod, options: any }[] = [];

  constructor(params?: {width: number, height: number, padding: number, intervalX: number, intervalY: number}) {
    if (params) {
      this.width = params.width || this.width;
      this.height = params.height || this.height;
      this.padding = params.padding || this.padding;
      this.intervalX = params.intervalX || this.intervalX;
      this.intervalY = params.intervalY || this.intervalY;
      this.plotWidth = this.width - 2 * this.padding;
      this.plotHeight = this.height - 2 * this.padding;
    }
  }

  scaleX(x: number): number {
    return this.padding + ((x - this.minX) / (this.maxX - this.minX)) * this.plotWidth;
  }
  scaleY(y: number): number {
    return this.height - this.padding - ((y - this.minY) / (this.maxY - this.minY)) * this.plotHeight;
  }

  scatterPlot({ points, color }: ScatterPlot): this {
    this.scatterPlots.push({ points, color });

    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);

    this.minX = Math.min(0, this.minX, ...xs);
    this.maxX = Math.max(0, this.maxX, ...xs);
    this.minY = Math.min(0, this.minY, ...ys);
    this.maxY = Math.max(0, this.maxY, ...ys);

    return this;
  }

  private getRegression(points: [number, number][], method: RegressionMethod, options: any = {}) {
    switch (method) {
      case 'linear':
        return regression.linear(points);
      case 'polynomial':
        return regression.polynomial(points, { order: options.order || 2 });
      case 'exponential':
        return regression.exponential(points);
      case 'logarithmic':
        return regression.logarithmic(points);
      case 'power':
        return regression.power(points);
      default:
        throw new Error(`Unsupported regression method: ${method}`);
    }
  }

  trendline(plotI: number, method: RegressionMethod, options: any = {}): this {
    this.trendlines.push({ plotI, method, options });

    return this;
  }

  private buildScatterPlot({ points, color }: ScatterPlot, svg: any): any {
    // X-axis
    if (this.minY <= 0 && this.maxY >= 0) {
      const yZero = this.scaleY(0);
      svg = svg.line({
        x1: this.padding,
        y1: yZero,
        x2: this.width - this.padding,
        y2: yZero,
        stroke: 'white',
        'stroke-width': 1
      });

      // X-axis labels
      for (let x = this.minX; x <= this.maxX; x += this.intervalX) {
        const xPos = this.scaleX(x);
        if (xPos >= this.padding && xPos <= this.width - this.padding) { // Check bounds
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
    if (this.minX <= 0 && this.maxX >= 0) {
      const xZero = this.scaleX(0);
      svg = svg.line({
        x1: xZero,
        y1: this.padding,
        x2: xZero,
        y2: this.height - this.padding,
        stroke: 'white',
        'stroke-width': 1
      });

      // Y-axis labels
      for (let y = this.minY; y <= this.maxY; y += this.intervalY) {
        const yPos = this.scaleY(y);
        if (yPos >= this.padding && yPos <= this.height - this.padding) { // Check bounds
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
        cx: this.scaleX(x),
        cy: this.scaleY(y),
        r: 4,
        fill: color || 'white'
      });
    }

    return svg;
  }

  private buildTrendline({ points, color }: ScatterPlot, method: RegressionMethod, options: any, svg: any): any {
    const result = this.getRegression(points, method, options);
    
    const numSteps = 200; // more steps = smoother curve
    const stepSize = (this.maxX - this.minX) / numSteps;

    const smoothPoints: [number, number][] = [];
    for (let i = 0; i <= numSteps; i++) {
      const x = this.minX + i * stepSize;
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
          x1: this.scaleX(x1),
          y1: this.scaleY(y1),
          x2: this.scaleX(x2),
          y2: this.scaleY(y2),
          stroke: color || 'white',
          'stroke-width': 2
        });
      }    
    }
  }

  build(): any {
    const gridColor = 'white';
    const gridOpacity = 0.1;

    let svg = svgBuilder.width(this.width).height(this.height).rect({
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      fill: '#222'
    });

    this.scatterPlots.forEach(scatterPlot => this.buildScatterPlot(scatterPlot, svg));
    this.trendlines.forEach(({ plotI, method, options }) => this.buildTrendline(this.scatterPlots[plotI], method, options, svg));

    // Vertical grid lines (X-axis)
    for (let x = this.minX; x <= this.maxX; x += this.intervalX) {
      const xPos = this.scaleX(x);
      if (xPos >= this.padding && xPos <= this.width - this.padding) {
        svg = svg.line({
          x1: xPos,
          y1: this.padding,
          x2: xPos,
          y2: this.height - this.padding,
          stroke: gridColor,
          'stroke-width': 1,
          'stroke-opacity': gridOpacity
        });
      }
    }

    // Horizontal grid lines (Y-axis)
    for (let y = this.minY; y <= this.maxY; y += this.intervalY) {
      const yPos = this.scaleY(y);
      if (yPos >= this.padding && yPos <= this.height - this.padding) {
        svg = svg.line({
          x1: this.padding,
          y1: yPos,
          x2: this.width - this.padding,
          y2: yPos,
          stroke: gridColor,
          'stroke-width': 1,
          'stroke-opacity': gridOpacity
        });
      }
    }

    return svg;
  }
}