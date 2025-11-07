import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropsService } from '../../services/props';

interface OddsEntry {
  sportsbook: string;
  odds: number;
  exchange?: 'ProphetX' | 'Novig' | 'Other';
}

interface PropWithOdds {
  id: string;
  entity_name: string;
  type_display: string;
  line: number;
  odds_entries: OddsEntry[];
  average_odds?: number;
  best_odds?: number;
  exchanges_included?: string[];
  is_value_play?: boolean;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
  providers: [PropsService]
})
export class Dashboard implements OnInit {
  props: PropWithOdds[] = [];
  filteredProps: PropWithOdds[] = [];
  
  // UI State
  editingPropId: string | null = null;
  newOddsEntry: OddsEntry = { sportsbook: '', odds: 0 };
  showAddForm = false;
  
  // Filter Controls
  filterOddsThreshold = -135;
  filterExchange = 'all'; // 'all', 'ProphetX', 'Novig'
  searchQuery = '';
  sortBy: 'average_odds' | 'best_odds' | 'line' = 'average_odds';
  sortDescending = true;
  
  // Stats
  totalProps = 0;
  valuePlayCount = 0;
  averageEdge = 0;

  constructor(private propsService: PropsService) {}

  ngOnInit() {
    this.loadProps();
  }

  loadProps() {
    this.propsService.getMockProps().subscribe(data => {
      // Initialize with mock data structure
      this.props = data.map(prop => ({
        ...prop,
        odds_entries: [],
        average_odds: undefined,
        exchanges_included: []
      }));
      this.applyFiltersAndSort();
      this.updateStats();
    });
  }

  // Add or update odds entry for a prop
  addOddsEntry(propId: string) {
    const prop = this.props.find(p => p.id === propId);
    if (prop && this.newOddsEntry.sportsbook && this.newOddsEntry.odds) {
      prop.odds_entries.push({ ...this.newOddsEntry });
      this.recalculatePropOdds(propId);
      this.newOddsEntry = { sportsbook: '', odds: 0 };
      this.editingPropId = null;
      this.applyFiltersAndSort();
      this.updateStats();
    }
  }

  removeOddsEntry(propId: string, index: number) {
    const prop = this.props.find(p => p.id === propId);
    if (prop) {
      prop.odds_entries.splice(index, 1);
      this.recalculatePropOdds(propId);
      this.applyFiltersAndSort();
      this.updateStats();
    }
  }

  recalculatePropOdds(propId: string) {
    const prop = this.props.find(p => p.id === propId);
    if (!prop || prop.odds_entries.length === 0) {
      prop!.average_odds = undefined;
      prop!.best_odds = undefined;
      prop!.exchanges_included = [];
      prop!.is_value_play = false;
      return;
    }

    // Calculate average odds
    const oddsValues = prop.odds_entries.map(e => e.odds);
    prop.average_odds = Math.round(
      oddsValues.reduce((a, b) => a + b, 0) / oddsValues.length
    );

    // Best odds (most negative = better)
    prop.best_odds = Math.min(...oddsValues);

    // Track exchanges
    prop.exchanges_included = [...new Set(prop.odds_entries
      .filter(e => e.exchange)
      .map(e => e.exchange!))];

    // Determine if value play (better than -135)
    prop.is_value_play = prop.average_odds <= this.filterOddsThreshold;
  }

  applyFiltersAndSort() {
    let filtered = [...this.props];

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.entity_name.toLowerCase().includes(query) ||
        p.type_display.toLowerCase().includes(query)
      );
    }

    // Exchange filter - only apply if we have odds entries
    if (this.filterExchange !== 'all') {
      filtered = filtered.filter(p =>
        p.odds_entries.length > 0 &&
        p.exchanges_included?.includes(this.filterExchange)
      );
    }

    // Sorting - keep all props, show ones with odds first
    filtered.sort((a, b) => {
      let aVal: number | undefined;
      let bVal: number | undefined;

      if (this.sortBy === 'average_odds') {
        // Props without odds go to bottom
        if (a.average_odds === undefined && b.average_odds === undefined) return 0;
        if (a.average_odds === undefined) return 1;
        if (b.average_odds === undefined) return -1;

        aVal = a.average_odds;
        bVal = b.average_odds;
      } else if (this.sortBy === 'best_odds') {
        // Props without odds go to bottom
        if (a.best_odds === undefined && b.best_odds === undefined) return 0;
        if (a.best_odds === undefined) return 1;
        if (b.best_odds === undefined) return -1;

        aVal = a.best_odds;
        bVal = b.best_odds;
      } else {
        aVal = a.line;
        bVal = b.line;
      }

      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;

      return this.sortDescending ? aVal - bVal : bVal - aVal;
    });

    this.filteredProps = filtered;
  }

  updateStats() {
    this.totalProps = this.props.length;
    this.valuePlayCount = this.props.filter(p => p.is_value_play).length;
    
    // Calculate average edge
    const valuePlays = this.props.filter(p => p.average_odds !== undefined);
    if (valuePlays.length > 0) {
      const avgOdds = valuePlays.reduce((sum, p) => sum + (p.average_odds || 0), 0) / valuePlays.length;
      this.averageEdge = Math.round((this.filterOddsThreshold - avgOdds) * 10) / 10;
    }
  }

  // Utility functions
  oddsToImpliedProbability(odds: number): string {
    // Convert American odds to implied probability
    if (odds < 0) {
      const prob = (-odds) / ((-odds) + 100);
      return (prob * 100).toFixed(1);
    } else {
      const prob = 100 / (odds + 100);
      return (prob * 100).toFixed(1);
    }
  }

  getOddsColor(odds: number): string {
    if (odds <= -150) return 'text-success'; // Great odds
    if (odds <= -135) return 'text-info';    // Good odds
    if (odds <= -110) return 'text-warning'; // Fair odds
    return 'text-danger';                    // Poor odds
  }

  setEditingProp(propId: string | null) {
    this.editingPropId = propId;
    this.newOddsEntry = { sportsbook: '', odds: 0 };
  }

  onFilterChange() {
    this.applyFiltersAndSort();
    this.updateStats();
  }

  onSortChange(sortBy: 'average_odds' | 'best_odds' | 'line') {
    if (this.sortBy === sortBy) {
      this.sortDescending = !this.sortDescending;
    } else {
      this.sortBy = sortBy;
      this.sortDescending = true;
    }
    this.applyFiltersAndSort();
  }
}