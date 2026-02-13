import { Component, AfterViewInit, Input, ElementRef, ViewChild, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-projects-by-department',
  template: `<div #chartContainer class="chart-container" (click)="onChartClick()" (touchstart)="onChartClick()"></div>`,
  styles: [`
    .chart-container {
      height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class ProjectsByDepartmentComponent implements AfterViewInit, OnChanges {
  @Input() departments: { name: string; count: number }[] = [];

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

  // Redraw when inputs change
  ngOnChanges(changes: SimpleChanges): void {
    if (this.chartDrawn && this.chartContainer && changes['departments']) {
      console.log('📊 Departments Chart - Data changed:', this.departments);
      setTimeout(() => {
        this.drawChart();
      }, 0);
    }
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

    if (this.departments.length === 0) {
      svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .text('No data')
        .style('font-size', '14px')
        .style('fill', '#6b7280');
      return;
    }

    const xScale = d3.scaleBand()
      .domain(this.departments.map(d => d.name))
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(this.departments, d => d.count) || 1])
      .nice()
      .range([innerHeight, 0]);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    svg.append('g')
      .call(d3.axisLeft(yScale));

    // Bars
    const colors = ['#2E7D32', '#1976D2', '#F57C00', '#D32F2F'];
    svg.selectAll('.bar')
      .data(this.departments)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.name)!)
      .attr('y', d => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.count))
      .style('fill', (d, i) => colors[i % colors.length])
      .style('stroke', '#388E3C')
      .style('stroke-width', '1px')
      .style('cursor', 'pointer')
      .on('mouseenter', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('y', (d: any) => yScale(d.count) - 8)
          .attr('height', (d: any) => innerHeight - yScale(d.count) + 8)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('y', (d: any) => yScale(d.count))
          .attr('height', (d: any) => innerHeight - yScale(d.count))
          .style('filter', 'none');
      });

    // Bar labels
    svg.selectAll('.bar-label')
      .data(this.departments)
      .enter().append('text')
      .attr('x', d => xScale(d.name)! + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.count) - 5)
      .attr('text-anchor', 'middle')
      .text(d => d.count)
      .style('font-size', '12px')
      .style('fill', '#000000');
    
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