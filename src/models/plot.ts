const svgBuilder = require('svg-builder');
const regression = require('regression');

type RegressionMethod = 'linear' | 'polynomial' | 'exponential' | 'logarithmic' | 'power';
export type ScatterPlot = { points: [number, number][], color?: string, title: string };

export class PlotBuilder {
  private width: number = 800;
  private height: number = 600;
  private padding: number = 40;
  private verticalGrid: number = 8;
  private horizontalGrid: number = 8;
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

  private xTitle: string = "";

  constructor(params?: {width?: number, height?: number, padding?: number, verticalGrid?: number, horizontalGrid?: number}) {
    if (params) {
      this.width = params.width || this.width;
      this.height = params.height || this.height;
      this.padding = params.padding || this.padding;
      this.verticalGrid = params.verticalGrid || this.verticalGrid;
      this.horizontalGrid = params.horizontalGrid || this.horizontalGrid;
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

  scatterPlot({ points, color, title }: ScatterPlot): this {
    this.scatterPlots.push({ points, color: color || `hsl(${this.scatterPlots.length * 30},60%,60%)`, title });

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

  setXTitle(xTitle: string): this {
    this.xTitle = xTitle;

    return this;
  }

  private buildAxes(svg: any): any {
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
          }, `${parseFloat(x.toFixed(2))}`);
        }
      }

    // X axis title
      svg = svg.text({
        x: this.scaleX((this.minX + this.maxX) / 2),
        y: this.scaleY(0) + 30,
        fill: 'white',
        'font-size': 12,
        'text-anchor': 'middle'
      }, this.xTitle)
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
          }, `${parseFloat(y.toFixed(2))}`);
        }
      }

      // Y axis titles
      svg = svg.rect({
        x: this.padding,
        y: this.padding / 4,
        width: this.width - 2 * this.padding,
        height: this.padding / 2,
        rx: this.padding / 4,
        fill: '#1115'
      });

      let i = 0;
      this.scatterPlots.forEach(plot => {
        svg = svg.text({
          x: this.padding + (i + 1) * (this.width - 2 * this.padding) / (this.scatterPlots.length + 1),
          y: this.padding / 2,
          fill: plot.color || 'white',
          'font-size': 12,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle'
        }, plot.title);
        i++;
      });
    }

    return svg;
  }

  private buildScatterPlot({ points, color, title }: ScatterPlot, svg: any): any {
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

  private buildTrendline({ points, color, title }: ScatterPlot, method: RegressionMethod, options: any, svg: any): any {
    const result = this.getRegression(points, method, options);
    
    const numSteps = 200; // more steps = smoother curve
    const stepSize = (this.maxX - this.minX) / numSteps;

    const smoothPoints: [number, number][] = [];
    for (let i = 0; i <= numSteps; i++) {
      const x = this.minX + i * stepSize;
      const [_, y] = result.predict(x); // returns [x, y]
      smoothPoints.push([x, y]);
    }

    const pathData = smoothPoints.map((point, index) => {
      const command = `${index === 0 ? 'M' : 'L'}${this.scaleX(point[0])},${this.scaleY(point[1])}`;
      return command;
    }).join(' ');

    svg = svg.path({
      d: pathData,
      fill: 'none',
      stroke: color || 'white',
      'stroke-width': 2
    })

    return svg;
  }

  private buildGrid(svg: any): any {
    const gridColor = 'white';
    const gridOpacity = 0.1;

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

  build(): any {
    this.intervalX = (this.maxX - this.minX) / this.horizontalGrid;
    this.intervalY = (this.maxY - this.minY) / this.verticalGrid;

    if (Math.abs(this.intervalX) > 1) this.intervalX = Math.round(this.intervalX);
    else this.intervalX = 1 / Math.round(1 / this.intervalX);

    if (Math.abs(this.intervalY) > 1) this.intervalY = Math.round(this.intervalY);
    else this.intervalY = 1 / Math.round(1 / this.intervalY);

    let svg = svgBuilder.width(this.width).height(this.height).rect({
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      fill: '#222'
    });

    svg = this.buildGrid(svg);

    this.scatterPlots.forEach(scatterPlot => { svg = this.buildScatterPlot(scatterPlot, svg) } );
    this.trendlines.forEach(({ plotI, method, options }) => { svg = this.buildTrendline(this.scatterPlots[plotI], method, options, svg) } );

    svg = this.buildAxes(svg);

    return svg;
  }
}