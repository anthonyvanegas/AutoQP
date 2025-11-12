import * as fs from 'fs';
import * as path from 'path';

// Interfaces
interface SplashProp {
  id: string;
  entity_name: string;
  league: string;
  team: string;
  type_display: string;
  line: number;
}

interface SpankOddsProp {
  playerName: string;
  propType: string;
  line: number;
  odds: number;
  exchange: string;
  bookieId: number;
}

interface MergedProp {
  id: string;
  entity_name: string;
  type_display: string;
  line: number;
  average_odds: number;
  win_probability: number;
  exchanges: string[];
  bookieIds: number[];
  matched: boolean;
}

// Bookie ID to Exchange mapping (common exchanges)
const BOOKIE_TO_EXCHANGE: Record<number, string> = {
  807: 'ProphetX',
  433: 'ProphetX',
  624: 'Novig',
  625: 'Novig',
  937: 'Other',
  999: 'Other',
  379: 'Other',
  817: 'Other',
  816: 'Other',
  815: 'Other',
  818: 'Other',
  819: 'Other',
};

// Normalize prop type names for matching
function normalizePropType(splashType: string): string {
  const mapping: Record<string, string> = {
    'Pass Yds': 'Passing Yards',
    'Rec Yds': 'Receiving Yards',
    'Rush Yds': 'Rushing Yards',
    'Pass Comp': 'Pass Completions',
    'Rec': 'Receptions',
    'INT': 'Interceptions',
    'Pass TDs': 'Passing Touchdowns',
    'Kicking Pts': 'Kicking Points',
  };
  return mapping[splashType] || splashType;
}

// Normalize player names for matching (remove special characters, handle variations)
function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[.,'"]/g, '')
    .replace(/\s+/g, ' ');
}

// Calculate win probability from American odds
function calculateWinProbability(odds: number): number {
  if (odds < 0) {
    return (-odds) / ((-odds) + 100);
  } else {
    return 100 / (odds + 100);
  }
}

// Parse Splash props CSV
function parseSplashProps(csvPath: string): SplashProp[] {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const props: SplashProp[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 6) {
      props.push({
        id: parts[0].trim(),
        entity_name: parts[1].trim(),
        league: parts[2].trim(),
        team: parts[3].trim(),
        type_display: parts[4].trim(),
        line: parseFloat(parts[5].trim()),
      });
    }
  }

  return props;
}

// Parse SpankOdds data from text files
// This is a simplified parser - in production, you'd need to handle the full message format
function parseSpankOddsData(dataDir: string): SpankOddsProp[] {
  const props: SpankOddsProp[] = [];
  const files = ['0.txt', '1.txt', '2.txt', '3.txt', '4.txt', '5.txt', '6.txt', '7.txt', '8.txt', '9.txt'];

  // For PoC, we'll create mock data based on common patterns
  // In production, you'd parse the actual message format from SpankOdds
  // The format appears to be: timestamp####@@@@Line####@@@@...@juice=...@bookieid=...
  
  files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) return;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Look for LineChange messages with juice (odds) values
      // Pattern: @newoverjuice=-135.0@ or @newunderjuice=-135.0@
      // For player props, we'd need to match these with player names from initGameMesgs.txt
      
      // For now, create mock data structure that demonstrates the concept
      // In production, you'd parse the actual player prop messages
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  });

  // For PoC, generate mock SpankOdds data based on Splash props
  // This demonstrates the integration concept
  return generateMockSpankOddsData();
}

// Generate mock SpankOdds data for PoC
// In production, this would come from actual SpankOdds parsing
function generateMockSpankOddsData(): SpankOddsProp[] {
  // Common NCAAF players from Splash data with realistic odds
  const mockData: SpankOddsProp[] = [
    // Kevin Jennings - Pass Yds 283.5
    { playerName: 'Kevin Jennings', propType: 'Pass Yds', line: 283.5, odds: -130, exchange: 'ProphetX', bookieId: 807 },
    { playerName: 'Kevin Jennings', propType: 'Pass Yds', line: 283.5, odds: -135, exchange: 'Novig', bookieId: 624 },
    { playerName: 'Kevin Jennings', propType: 'Pass Yds', line: 283.5, odds: -125, exchange: 'Other', bookieId: 937 },
    
    // Lewis Bond - Rec Yds 74.5
    { playerName: 'Lewis Bond', propType: 'Rec Yds', line: 74.5, odds: -120, exchange: 'ProphetX', bookieId: 807 },
    { playerName: 'Lewis Bond', propType: 'Rec Yds', line: 74.5, odds: -115, exchange: 'Novig', bookieId: 624 },
    
    // Jordan Hudson - Rec Yds 69.5
    { playerName: 'Jordan Hudson', propType: 'Rec Yds', line: 69.5, odds: -110, exchange: 'ProphetX', bookieId: 807 },
    { playerName: 'Jordan Hudson', propType: 'Rec Yds', line: 69.5, odds: -105, exchange: 'Other', bookieId: 937 },
    
    // Turbo Richard - Rush Yds 49.5
    { playerName: 'Turbo Richard', propType: 'Rush Yds', line: 49.5, odds: -140, exchange: 'ProphetX', bookieId: 807 },
    { playerName: 'Turbo Richard', propType: 'Rush Yds', line: 49.5, odds: -135, exchange: 'Novig', bookieId: 624 },
    
    // TJ Harden - Rush Yds 46.5
    { playerName: 'TJ Harden', propType: 'Rush Yds', line: 46.5, odds: -125, exchange: 'ProphetX', bookieId: 807 },
    
    // Behren Morton - Pass Yds 254.5
    { playerName: 'Behren Morton', propType: 'Pass Yds', line: 254.5, odds: -115, exchange: 'ProphetX', bookieId: 807 },
    { playerName: 'Behren Morton', propType: 'Pass Yds', line: 254.5, odds: -120, exchange: 'Novig', bookieId: 624 },
    
    // Bear Bachmeier - Pass Yds 195.5
    { playerName: 'Bear Bachmeier', propType: 'Pass Yds', line: 195.5, odds: -110, exchange: 'ProphetX', bookieId: 807 },
    
    // Cameron Dickey - Rush Yds 77.5
    { playerName: 'Cameron Dickey', propType: 'Rush Yds', line: 77.5, odds: -130, exchange: 'ProphetX', bookieId: 807 },
    
    // LJ Martin - Rush Yds 66.5
    { playerName: 'LJ Martin', propType: 'Rush Yds', line: 66.5, odds: -120, exchange: 'ProphetX', bookieId: 807 },
    
    // Caleb Douglas - Rec Yds 65.5
    { playerName: 'Caleb Douglas', propType: 'Rec Yds', line: 65.5, odds: -115, exchange: 'ProphetX', bookieId: 807 },
  ];

  return mockData;
}

// Match Splash props with SpankOdds data
function matchProps(splashProps: SplashProp[], spankOddsProps: SpankOddsProp[]): MergedProp[] {
  const merged: MergedProp[] = [];

  for (const splashProp of splashProps) {
    const normalizedPlayer = normalizePlayerName(splashProp.entity_name);
    const normalizedType = normalizePropType(splashProp.type_display);

    // Find matching SpankOdds props
    const matches = spankOddsProps.filter(spank => {
      const normalizedSpankPlayer = normalizePlayerName(spank.playerName);
      const normalizedSpankType = normalizePropType(spank.propType);
      
      // Match by player name and prop type (line should be close, but allow some variance)
      return normalizedSpankPlayer === normalizedPlayer &&
             normalizedSpankType === normalizedType &&
             Math.abs(spank.line - splashProp.line) < 1.0; // Allow 1 point variance
    });

    if (matches.length > 0) {
      // Calculate average odds
      const avgOdds = matches.reduce((sum, m) => sum + m.odds, 0) / matches.length;
      const winProb = calculateWinProbability(avgOdds) * 100;
      
      // Get unique exchanges
      const exchanges = [...new Set(matches.map(m => m.exchange))];
      const bookieIds = [...new Set(matches.map(m => m.bookieId))];

      merged.push({
        id: splashProp.id,
        entity_name: splashProp.entity_name,
        type_display: splashProp.type_display,
        line: splashProp.line,
        average_odds: Math.round(avgOdds),
        win_probability: Math.round(winProb * 100) / 100,
        exchanges,
        bookieIds,
        matched: true,
      });
    } else {
      // No match found - still include but mark as unmatched
      merged.push({
        id: splashProp.id,
        entity_name: splashProp.entity_name,
        type_display: splashProp.type_display,
        line: splashProp.line,
        average_odds: 0,
        win_probability: 0,
        exchanges: [],
        bookieIds: [],
        matched: false,
      });
    }
  }

  return merged;
}

// Main integration function
function integrateData() {
  console.log('Starting data integration...\n');

  // Paths
  const splashCsvPath = path.join(__dirname, '../frontend/src/assets/data/splash_props_all.csv');
  const spankOddsDir = path.join(__dirname, '../TestData/SpankOdds/SpankOdds_110825/last');

  // Parse data
  console.log('Parsing Splash props CSV...');
  const splashProps = parseSplashProps(splashCsvPath);
  console.log(`Found ${splashProps.length} Splash props\n`);

  console.log('Parsing SpankOdds data...');
  const spankOddsProps = parseSpankOddsData(spankOddsDir);
  console.log(`Found ${spankOddsProps.length} SpankOdds props\n`);

  // Match and merge
  console.log('Matching props...');
  const mergedProps = matchProps(splashProps, spankOddsProps);
  
  // Filter to only matched props and sort by win % descending
  const matchedProps = mergedProps
    .filter(p => p.matched)
    .sort((a, b) => b.win_probability - a.win_probability);

  console.log(`Matched ${matchedProps.length} props\n`);

  // Output results
  console.log('=== MERGED DATASET (Sorted by Win % Descending) ===\n');
  console.log('Player | Prop Type | Splash Line | Avg Odds | Win % | Exchanges');
  console.log('-'.repeat(80));

  matchedProps.forEach(prop => {
    const exchangesStr = prop.exchanges.join(', ') || 'None';
    console.log(
      `${prop.entity_name.padEnd(20)} | ${prop.type_display.padEnd(15)} | ${prop.line.toString().padStart(6)} | ${prop.average_odds.toString().padStart(6)} | ${prop.win_probability.toFixed(2).padStart(5)}% | ${exchangesStr}`
    );
  });

  // Write to JSON file
  const outputPath = path.join(__dirname, '../frontend/src/assets/data/merged_props.json');
  fs.writeFileSync(outputPath, JSON.stringify(matchedProps, null, 2));
  console.log(`\n\nResults written to: ${outputPath}`);

  // Write to CSV for easy viewing
  const csvPath = path.join(__dirname, '../frontend/src/assets/data/merged_props.csv');
  let csv = 'Player,Prop Type,Splash Line,Average Odds,Win %,Exchanges\n';
  matchedProps.forEach(prop => {
    csv += `"${prop.entity_name}","${prop.type_display}",${prop.line},${prop.average_odds},${prop.win_probability.toFixed(2)},${prop.exchanges.join(';')}\n`;
  });
  fs.writeFileSync(csvPath, csv);
  console.log(`Results also written to CSV: ${csvPath}`);

  console.log('\n✅ Integration complete!');
}

// Run if executed directly
if (require.main === module) {
  integrateData();
}

export { integrateData, parseSplashProps, parseSpankOddsData, matchProps };

