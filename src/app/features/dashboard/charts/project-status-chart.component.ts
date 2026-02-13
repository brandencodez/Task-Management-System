import { Component, AfterViewInit, Input, ElementRef, ViewChild, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-project-status-chart',
  template: `<div #chartContainer class="chart-container" (click)="onChartClick()" (touchstart)="onChartClick()"></div>`,
  styles: [`
    .chart-container {
      height: 350px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
  `]
})
export class ProjectStatusChartComponent implements AfterViewInit, OnChanges {
  @Input() onTrack = 0;
  @Input() completed = 0;
  @Input() warning = 0;
  @Input() overdue = 0;

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  
  private chartDrawn = false;
  private isActive = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.drawChart();
      this.chartDrawn = true;
    }, 10);
  }

  // THIS IS THE KEY - Redraw when inputs change
  ngOnChanges(changes: SimpleChanges): void {
    // Only redraw if chart has been initialized and data actually changed
    if (this.chartDrawn && this.chartContainer) {
      console.log('📊 Project Status Chart - Data changed:', {
        onTrack: this.onTrack,
        completed: this.completed,
        warning: this.warning,
        overdue: this.overdue
      });
      setTimeout(() => {
        this.drawChart();
      }, 0);
    }
  }

  private drawChart(): void {
    const container = this.chartContainer.nativeElement;
    if (!container) return;
    
    // Clear previous content
    container.innerHTML = '';

    const width = 400, height = 300, radius = Math.min(width, height) / 2 - 60;
    const svg = d3.select(container).append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

    const data = [
      { label: 'On Track', value: this.onTrack, color: '#2E7D32' },
      { label: 'Completed', value: this.completed, color: '#1976D2' },
      { label: 'Warning', value: this.warning, color: '#F57C00' },
      { label: 'Overdue', value: this.overdue, color: '#D32F2F' }
    ].filter(d => d.value > 0);

    if (data.length === 0) {
      svg.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text('No data')
        .style('font-size', '14px')
        .style('fill', '#6b7280');
      return;
    }

    const pie = d3.pie<{label: string, value: number, color: string}>()
      .value(d => d.value)
      .sort(null);

    const path = d3.arc<d3.PieArcDatum<{label: string, value: number, color: string}>>()
      .outerRadius(radius)
      .innerRadius(0);

    const arcs = svg.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc');

    const largerPath = d3.arc<d3.PieArcDatum<{label: string, value: number, color: string}>>()
      .outerRadius(radius * 1.1)
      .innerRadius(0);

    arcs.append('path')
      .attr('d', path)
      .style('fill', d => d.data.color)
      .style('cursor', 'pointer')
      .on('mouseenter', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', (d: any) => largerPath(d) || '')
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', (d: any) => path(d) || '')
          .style('filter', 'none');
      })
      .style('stroke', '#fff')
      .style('stroke-width', '2px');

    // Add percentage labels inside the pie
    arcs.append('text')
      .attr('transform', d => {
        const [x, y] = path.centroid(d);
        return `translate(${x}, ${y})`;
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(d => `${Math.round((d.data.value / data.reduce((s, i) => s + i.value, 0)) * 100)}%`)
      .style('font-size', '12px')
      .style('fill', '#000000')
      .style('font-weight', 'bold');

    // Add legend 
    const legend = svg.append('g')
      .attr('transform', `translate(${radius + 20}, -${radius - 10})`);

    const legendItems = legend.selectAll('g')
      .data(data)
      .enter().append('g')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    // Color squares
    legendItems.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .style('fill', d => d.color);

    // Labels
    legendItems.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .text(d => d.label)
      .style('font-size', '11px')
      .style('fill', '#000000')
      .style('font-weight', '500');
    
    // Trigger change detection
    this.cdr.markForCheck();
  }

  onChartClick(): void {
    this.isActive = !this.isActive;
    if (this.chartContainer) {
      if (this.isActive) {
        this.chartContainer.nativeElement.classList.add('active');
      } else {
        this.chartContainer.nativeElement.classList.remove('active');
      }
    }
  }
}