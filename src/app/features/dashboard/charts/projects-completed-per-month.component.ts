import { Component, AfterViewInit, Input, ElementRef, ViewChild } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-projects-completed-per-month',
  template: `<div #chartContainer></div>`,
  styles: [`
    .chart-container {
    height: 880px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  `]
})
export class ProjectsCompletedPerMonthComponent implements AfterViewInit {
  @Input() months: { month: string; count: number }[] = [];

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.drawChart();
    }, 10);
  }

  private drawChart(): void {
    const container = this.chartContainer.nativeElement;
    if (!container) return;
    
    container.innerHTML = '';

    const width = 400, height = 250, margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container).append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    if (this.months.length === 0) {
      svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .text('No data')
        .style('font-size', '14px')
        .style('fill', '#6b7280');
      return;
    }

    const xScale = d3.scalePoint()
      .domain(this.months.map(d => d.month))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(this.months, d => d.count) || 1])
      .nice()
      .range([innerHeight, 0]);

    const line = d3.line<{month: string, count: number}>()
      .x(d => xScale(d.month)!)
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    // Line
    svg.append('path')
      .datum(this.months)
      .attr('fill', 'none')
      .attr('stroke', '#2196F3')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Points
    svg.selectAll('.point')
      .data(this.months)
      .enter().append('circle')
      .attr('cx', d => xScale(d.month)!)
      .attr('cy', d => yScale(d.count))
      .attr('r', 4)
      .style('fill', '#2196F3')
      .style('stroke', '#fff')
      .style('stroke-width', '2px');

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    svg.append('g')
      .call(d3.axisLeft(yScale));
  }
}