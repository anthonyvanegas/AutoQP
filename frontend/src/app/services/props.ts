import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import mergedPropsData from '../../assets/data/merged_props.json';

interface MockProp {
  id: string;
  entity_name: string;
  type_display: string;
  line: number;
}

interface MergedProp {
  id: string;
  entity_name: string;
  type_display: string;
  line: number;
  average_odds: number;
  win_probability: number;
  odds_by_bookie?: { [bookieId: string]: number }; // Odds per bookie ID
  side_by_bookie?: { [bookieId: string]: string }; // Side (over/under) per bookie
  odds_by_exchange?: { [exchange: string]: number }; // Odds per exchange
  primary_side?: 'over' | 'under' | null; // Primary side for this prop
  exchanges: string[];
  bookieIds: number[];
  matched: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PropsService {

  constructor() { }

  // Mock data from splash_props_all.csv
  private mockProps: MockProp[] = [
    { id: 'prop_690b3b52', entity_name: 'Pascal Siakam', type_display: 'Pts+Reb+Asts', line: 39.5 },
    { id: 'prop_690af051', entity_name: 'Cam Thomas', type_display: 'Pts+Reb+Asts', line: 31.5 },
    { id: 'prop_690b67db', entity_name: 'Pascal Siakam', type_display: 'Pts+Reb', line: 33.5 },
    { id: 'prop_690af051b', entity_name: 'Michael Porter Jr.', type_display: 'Pts+Reb+Asts', line: 28.5 },
    { id: 'prop_690ae36d', entity_name: 'Pascal Siakam', type_display: 'Pts+Asts', line: 32.5 },
    { id: 'prop_690ae36d2', entity_name: 'Cam Thomas', type_display: 'Pts+Reb', line: 27.5 },
    { id: 'prop_690b01e6', entity_name: 'Jarace Walker', type_display: 'Pts+Reb+Asts', line: 26.5 },
    { id: 'prop_690ae499', entity_name: 'Cam Thomas', type_display: 'Pts+Asts', line: 27.5 },
    { id: 'prop_690ae36dd', entity_name: 'Pascal Siakam', type_display: 'Points', line: 26.5 },
    { id: 'prop_690ae36d3', entity_name: 'Michael Porter Jr.', type_display: 'Pts+Reb', line: 25.5 },
    { id: 'prop_690ac3c8', entity_name: 'Isaiah Stewart', type_display: 'Pts+Reb+Asts', line: 24.5 },
    { id: 'prop_690ae949', entity_name: 'Keyonte George', type_display: 'Pts+Reb', line: 23.5 },
    { id: 'prop_690b66ae', entity_name: 'Isaiah Stewart', type_display: 'Pts+Reb', line: 21.5 },
    { id: 'prop_690af759', entity_name: 'Jusuf Nurkić', type_display: 'Pts+Reb+Asts', line: 23.5 },
    { id: 'prop_690af759a', entity_name: 'Ausar Thompson', type_display: 'Pts+Reb', line: 20.5 },
    { id: 'prop_690ac3c8a', entity_name: 'Jusuf Nurkić', type_display: 'Pts+Reb', line: 20.5 },
    { id: 'prop_690ad1d9', entity_name: 'Jalen Duren', type_display: 'Pts+Asts', line: 18.5 },
    { id: 'prop_690af759b', entity_name: 'Keyonte George', type_display: 'Points', line: 19.5 },
    { id: 'prop_690ac29dd', entity_name: 'Duncan Robinson', type_display: 'Pts+Reb+Asts', line: 17.5 },
    { id: 'prop_690b6905', entity_name: 'Kyle Filipowski', type_display: 'Pts+Reb+Asts', line: 15.5 },
    { id: 'prop_690ad1d9a', entity_name: 'Ausar Thompson', type_display: 'Pts+Asts', line: 17.5 },
    { id: 'prop_690b66aeb', entity_name: 'Aaron Nesmith', type_display: 'Pts+Reb+Asts', line: 24.5 },
    { id: 'prop_690b5c22', entity_name: 'Cam Thomas', type_display: 'Points', line: 23.5 },
    { id: 'prop_690b690d', entity_name: 'Aaron Nesmith', type_display: 'Pts+Reb', line: 22.5 },
    { id: 'prop_690b5c22a', entity_name: 'Nic Claxton', type_display: 'Pts+Reb+Asts', line: 22.5 },
    { id: 'prop_690b07c2', entity_name: 'Jarace Walker', type_display: 'Pts+Reb', line: 22.5 },
    { id: 'prop_690ae36da', entity_name: 'Michael Porter Jr.', type_display: 'Pts+Asts', line: 21.5 },
    { id: 'prop_690b5d4d', entity_name: 'Aaron Nesmith', type_display: 'Pts+Asts', line: 19.5 },
    { id: 'prop_690b4ce5', entity_name: 'Nic Claxton', type_display: 'Pts+Reb', line: 19.5 },
    { id: 'prop_690b67db2', entity_name: 'Jarace Walker', type_display: 'Pts+Asts', line: 18.5 },
  ];

  /**
   * Get mock props data
   * In production, this would fetch from the backend API
   */
  getMockProps(): Observable<MockProp[]> {
    return of([...this.mockProps]);
  }

  /**
   * Get merged props data (Splash + SpankOdds)
   * This loads the automatically integrated dataset
   */
  getMergedProps(): Observable<MergedProp[]> {
    // Load from the integrated dataset
    const mergedData = (mergedPropsData as any);
    // Handle both old format (array) and new format (object with metadata)
    const props = Array.isArray(mergedData) ? mergedData : (mergedData.props || mergedData);
    return of([...props]);
  }

  /**
   * Get all available bookie IDs from merged data metadata
   */
  getAllAvailableBookieIds(): number[] {
    const mergedData = (mergedPropsData as any);
    if (mergedData.metadata && mergedData.metadata.all_available_bookie_ids) {
      return mergedData.metadata.all_available_bookie_ids;
    }
    // Fallback: extract from props if metadata not available
    const allBookieIdsSet = new Set<number>();
    const props = Array.isArray(mergedData) ? mergedData : (mergedData.props || mergedData);
    props.forEach((prop: MergedProp) => {
      if (prop.odds_by_bookie) {
        Object.keys(prop.odds_by_bookie).forEach(id => allBookieIdsSet.add(parseInt(id)));
      }
      prop.bookieIds?.forEach(id => allBookieIdsSet.add(id));
    });
    return Array.from(allBookieIdsSet).sort((a, b) => a - b);
  }

  /**
   * Get exchange name for a given bookie ID
   */
  getExchangeForBookie(bookieId: number): string {
    const mergedData = (mergedPropsData as any);
    if (mergedData.metadata && mergedData.metadata.bookie_to_exchange) {
      return mergedData.metadata.bookie_to_exchange[bookieId] || 'Unknown';
    }
    return 'Unknown';
  }

  /**
   * Get all available exchanges from merged data metadata
   */
  getAllAvailableExchanges(): string[] {
    const mergedData = (mergedPropsData as any);
    if (mergedData.metadata && mergedData.metadata.all_available_exchanges) {
      return mergedData.metadata.all_available_exchanges;
    }
    // Fallback: extract from props if metadata not available
    const allExchangesSet = new Set<string>();
    const props = Array.isArray(mergedData) ? mergedData : (mergedData.props || mergedData);
    props.forEach((prop: MergedProp) => {
      if (prop.odds_by_exchange) {
        Object.keys(prop.odds_by_exchange).forEach(ex => allExchangesSet.add(ex));
      }
      prop.exchanges?.forEach(ex => allExchangesSet.add(ex));
    });
    const sortedExchanges = Array.from(allExchangesSet).sort((a, b) => {
      const order = ['ProphetX', 'Novig'];
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
    return sortedExchanges;
  }

  /**
   * Import props from CSV file
   * In production, this would call a backend upload endpoint
   */
  importPropsFromCSV(file: File): Observable<MockProp[]> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n');
          const props: MockProp[] = [];

          // Skip header row
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const [id, entity_name, type_display, line_str] = line.split(',').map(s => s.trim());
            props.push({
              id,
              entity_name,
              type_display,
              line: parseFloat(line_str)
            });
          }

          observer.next(props);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      };
      reader.onerror = () => {
        observer.error(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * Export props and odds data as CSV
   */
  exportToCSV(props: any[], filename = 'props_with_odds.csv'): void {
    let csv = 'Player,Prop Type,Splash Line,Average Odds,Best Odds,Exchanges\n';

    props.forEach(prop => {
      const exchanges = prop.exchanges_included?.join(';') || '';
      csv += `"${prop.entity_name}","${prop.type_display}",${prop.line},${prop.average_odds || ''},${prop.best_odds || ''},"${exchanges}"\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /**
   * Calculate implied probability from American odds
   */
  calculateImpliedProbability(americanOdds: number): number {
    if (americanOdds < 0) {
      return (-americanOdds) / ((-americanOdds) + 100);
    } else {
      return 100 / (americanOdds + 100);
    }
  }

  /**
   * Convert implied probability to American odds
   */
  probabilityToAmericanOdds(probability: number): number {
    if (probability >= 0.5) {
      // Negative odds
      return -100 * probability / (1 - probability);
    } else {
      // Positive odds
      return 100 * (1 - probability) / probability;
    }
  }

  /**
   * Calculate edge between two odds
   * Returns the win probability advantage (in percentage points)
   */
  calculateEdge(expectedOdds: number, marketOdds: number): number {
    const expectedProb = this.calculateImpliedProbability(expectedOdds);
    const marketProb = this.calculateImpliedProbability(marketOdds);
    return (marketProb - expectedProb) * 100; // Convert to percentage points
  }

  /**
   * Get sportsbooks from mock data (used for autocomplete)
   */
  getCommonSportsbooks(): string[] {
    return [
      'Unabated',
      'DraftKings',
      'FanDuel',
      'BetMGM',
      'Caesars',
      'WynnBET',
      'Pointsbet',
      'BetRivers',
      'ProphetX',
      'Novig',
      'Other'
    ];
  }
}






