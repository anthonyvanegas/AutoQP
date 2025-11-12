import { Component, OnInit, AfterViewInit } from '@angular/core';
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
  odds_by_bookie?: { [bookieId: string]: number }; // Odds per bookie ID
  side_by_bookie?: { [bookieId: string]: string }; // Side (over/under) per bookie
  odds_by_exchange?: { [exchange: string]: number }; // Odds per exchange
  primary_side?: 'over' | 'under' | null; // Primary side
  exchanges_included?: string[];
  is_value_play?: boolean;
  win_probability?: number; // From merged data
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
  providers: [PropsService]
})
export class Dashboard implements OnInit, AfterViewInit {
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
  sortBy: 'average_odds' | 'best_odds' | 'line' | 'win_probability' = 'win_probability';
  sortDescending = true;
  useMergedData = true; // Toggle between mock and merged data
  
  // All bookie IDs (individual books) found in data
  allBookieIds: number[] = [];
  
  // All exchanges found in data
  allExchanges: string[] = [];
  
  // Stats
  totalProps = 0;
  valuePlayCount = 0;
  averageEdge = 0;

  constructor(private propsService: PropsService) {}

  ngOnInit() {
    this.loadProps();
  }

  loadProps() {
    if (this.useMergedData) {
      // Load merged data (Splash + SpankOdds)
      this.propsService.getMergedProps().subscribe(data => {
        // Get all available bookie IDs from metadata (all individual books that have odds data)
        this.allBookieIds = this.propsService.getAllAvailableBookieIds();
        // Get all available exchanges from metadata
        this.allExchanges = this.propsService.getAllAvailableExchanges();
        
        this.props = data.map(prop => ({
          ...prop,
          odds_entries: [], // Merged data already has odds calculated
          average_odds: prop.average_odds,
          best_odds: prop.average_odds, // Use average as best for now
          odds_by_bookie: prop.odds_by_bookie, // Pass through odds by bookie ID
          side_by_bookie: prop.side_by_bookie, // Pass through side by bookie
          odds_by_exchange: prop.odds_by_exchange, // Pass through odds by exchange
          primary_side: prop.primary_side, // Pass through primary side
          exchanges_included: prop.exchanges,
          is_value_play: prop.win_probability >= 57.0, // ~57% = -135 odds threshold
          win_probability: prop.win_probability
        }));
        this.applyFiltersAndSort();
        this.updateStats();
        
        // Update scrollbar widths and column positions after data loads
        setTimeout(() => {
          this.updateScrollbarWidths();
          this.updateStickyColumnPositions();
        }, 200);
      });
    } else {
      // Load mock data (original)
      this.propsService.getMockProps().subscribe(data => {
        this.props = data.map(prop => ({
          ...prop,
          odds_entries: [],
          average_odds: undefined,
          best_odds: undefined,
          is_value_play: false,
          win_probability: undefined
        }));
        this.applyFiltersAndSort();
        this.updateStats();
      });
    }
  }

  /**
   * Get exchange name for a bookie ID
   */
  getExchangeForBookie(bookieId: number): string {
    return this.propsService.getExchangeForBookie(bookieId);
  }

  /**
   * Update scrollbar widths
   */
  updateScrollbarWidths() {
    const tableWrapper = document.querySelector('.table-wrapper');
    if (tableWrapper) {
      const tableScroll = tableWrapper.querySelector('.table-responsive') as HTMLElement;
      const topScrollbar = tableWrapper.querySelector('.table-scrollbar-top') as HTMLElement;
      const bottomScrollbar = tableWrapper.querySelector('.table-scrollbar-bottom') as HTMLElement;
      const topContent = topScrollbar?.querySelector('.table-scrollbar-content') as HTMLElement;
      const bottomContent = bottomScrollbar?.querySelector('.table-scrollbar-content') as HTMLElement;
      
      if (tableScroll && topContent && bottomContent) {
        const tableWidth = tableScroll.scrollWidth;
        topContent.style.width = `${tableWidth}px`;
        bottomContent.style.width = `${tableWidth}px`;
      }
    }
  }

  /**
   * Update sticky column positions for exchange columns and average
   */
  updateStickyColumnPositions() {
    // Calculate right positions for sticky columns
    // Order from right: Actions (110px), Win % (110px), Exchanges (100px each), Average (120px)
    const actionsWidth = 110;
    const winProbWidth = 110;
    const exchangeWidth = 100;
    const averageWidth = 120;
    
    // Set average column position (after all exchanges)
    const averageRight = actionsWidth + winProbWidth + (this.allExchanges.length * exchangeWidth);
    const averageElements = document.querySelectorAll('.col-average');
    averageElements.forEach(el => {
      (el as HTMLElement).style.right = `${averageRight}px`;
    });
  }

  /**
   * Sync scrollbars when table scrolls
   */
  ngAfterViewInit() {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      const tableWrapper = document.querySelector('.table-wrapper');
      if (tableWrapper) {
        const tableScroll = tableWrapper.querySelector('.table-responsive') as HTMLElement;
        const topScrollbar = tableWrapper.querySelector('.table-scrollbar-top') as HTMLElement;
        const bottomScrollbar = tableWrapper.querySelector('.table-scrollbar-bottom') as HTMLElement;
        
        if (tableScroll && topScrollbar && bottomScrollbar) {
          // Set scrollbar content width to match table width
          this.updateScrollbarWidths();
          
          // Sync scrolling between table and scrollbars
          let isScrolling = false;
          
          tableScroll.addEventListener('scroll', () => {
            if (!isScrolling) {
              isScrolling = true;
              topScrollbar.scrollLeft = tableScroll.scrollLeft;
              bottomScrollbar.scrollLeft = tableScroll.scrollLeft;
              setTimeout(() => { isScrolling = false; }, 10);
            }
          });
          
          topScrollbar.addEventListener('scroll', () => {
            if (!isScrolling) {
              isScrolling = true;
              tableScroll.scrollLeft = topScrollbar.scrollLeft;
              bottomScrollbar.scrollLeft = topScrollbar.scrollLeft;
              setTimeout(() => { isScrolling = false; }, 10);
            }
          });
          
          bottomScrollbar.addEventListener('scroll', () => {
            if (!isScrolling) {
              isScrolling = true;
              tableScroll.scrollLeft = bottomScrollbar.scrollLeft;
              topScrollbar.scrollLeft = bottomScrollbar.scrollLeft;
              setTimeout(() => { isScrolling = false; }, 10);
            }
          });
          
          // Update on window resize
          window.addEventListener('resize', () => {
            this.updateScrollbarWidths();
          });
        }
      }
    }, 100);
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

      if (this.sortBy === 'win_probability') {
        // Sort by win probability (highest first by default)
        if (a.win_probability === undefined && b.win_probability === undefined) return 0;
        if (a.win_probability === undefined) return 1;
        if (b.win_probability === undefined) return -1;

        aVal = a.win_probability;
        bVal = b.win_probability;
      } else if (this.sortBy === 'average_odds') {
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

      // For win_probability, descending means highest first
      // For odds, descending means most negative first (better)
      if (this.sortBy === 'win_probability') {
        return this.sortDescending ? bVal - aVal : aVal - bVal;
      } else {
        return this.sortDescending ? aVal - bVal : bVal - aVal;
      }
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

  onSortChange(sortBy: 'average_odds' | 'best_odds' | 'line' | 'win_probability') {
    if (this.sortBy === sortBy) {
      this.sortDescending = !this.sortDescending;
    } else {
      this.sortBy = sortBy;
      this.sortDescending = true;
    }
    this.applyFiltersAndSort();
  }
}