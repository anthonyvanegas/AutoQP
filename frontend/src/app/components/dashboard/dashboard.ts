import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropDataService } from '../../services/prop-data';
import { Prop } from '../../models/prop';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  allProps: Prop[] = [];
  displayedProps: Prop[] = [];
  filterActive: boolean = false;
  oddsThreshold: number = -135;

  constructor(private propDataService: PropDataService) {}

  ngOnInit(): void {
    this.allProps = this.propDataService.getProps();
    this.displayedProps = this.allProps;
  }

  toggleFilter(): void {
    this.filterActive = !this.filterActive;
    
    if (this.filterActive) {
      this.displayedProps = this.propDataService.getFilteredProps(this.oddsThreshold);
    } else {
      this.displayedProps = this.allProps;
    }
  }

  get totalProps(): number {
    return this.allProps.length;
  }

  get filteredCount(): number {
    return this.displayedProps.length;
  }
}