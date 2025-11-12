const fs = require('fs');
const path = require('path');

// Normalize prop type names for matching
function normalizePropType(splashType) {
  const mapping = {
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

// Normalize player names for matching
function normalizePlayerName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[.,'"]/g, '')
    .replace(/\s+/g, ' ');
}

// Calculate win probability from American odds
function calculateWinProbability(odds) {
  if (odds < 0) {
    return (-odds) / ((-odds) + 100);
  } else {
    return 100 / (odds + 100);
  }
}

// Parse Splash props CSV
function parseSplashProps(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const props = [];

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

// Parse SpankOdds player prop definitions from initGameMesgs.txt
function parseSpankOddsProps(initGameMesgsPath) {
  const content = fs.readFileSync(initGameMesgsPath, 'utf-8');
  const lines = content.split('\n');
  const props = [];
  
  for (const line of lines) {
    // Player prop lines have format: gameid~gameid~gameid+1~...~Player Name~Prop Type~Over~Under~...
    // Example: 47340569~47340569~47340570~0~0~1763328300000~1763328300000~Travis Kelce~Receiving Yds~Over~Under~1~...
    
    if (!line.includes('~') || line.includes('<table') || line.includes('</table')) {
      continue; // Skip HTML/table lines
    }
    
    const parts = line.split('~');
    if (parts.length < 10) continue;
    
    // Check if this looks like a player prop (has "Over" and "Under" in fields 9-10)
    const field7 = parts[7]?.trim();
    const field8 = parts[8]?.trim();
    const field9 = parts[9]?.trim();
    const field10 = parts[10]?.trim();
    
    // Player props have: Player Name, Prop Type, Over, Under
    if (field9 === 'Over' && field10 === 'Under' && field7 && field8) {
      const playerName = field7;
      let propType = field8;
      
      // Normalize prop type names to match Splash format
      const propTypeMapping = {
        'Receiving Yds': 'Rec Yds',
        'Rushing Yds': 'Rush Yds',
        'Passing Yds': 'Pass Yds',
        'Receptions': 'Rec',
        'Pass Completions': 'Pass Comp',
        'Interceptions': 'INT',
        'Passing Touchdowns': 'Pass TDs',
      };
      
      propType = propTypeMapping[propType] || propType;
      
      // Extract game IDs (first 3 fields)
      const gameId1 = parts[0]?.trim();
      const gameId2 = parts[1]?.trim();
      
      props.push({
        playerName: playerName,
        propType: propType,
        gameId1: gameId1,
        gameId2: gameId2,
      });
    }
  }
  
  return props;
}

// Parse actual odds from SpankOdds numbered files (0.txt, 1.txt, 2.txt, etc.)
function parseSpankOddsOdds(dataDir) {
  const oddsData = [];
  const files = ['0.txt', '1.txt', '2.txt'];
  
  // Bookie ID to Exchange mapping
  const BOOKIE_TO_EXCHANGE = {
    807: 'ProphetX',
    433: 'ProphetX',
    624: 'Novig',
    625: 'Novig',
    832: 'Other',
    937: 'Other',
    999: 'Other',
    379: 'Other',
    816: 'Other',
    815: 'Other',
    818: 'Other',
    819: 'Other',
    817: 'Other',
  };
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) continue;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Look for LineChangeTotal messages with player prop odds
      // Format: timestamp####@@@@Line####@@@@gameid=XXXXX@...@newoverjuice=-135.0@...@newunderjuice=-110.0@...@newover=XX.X@...@newunder=XX.X@...@bookieid=XXX@...
      if (line.includes('messageType=LineChangeTotal') && line.includes('gameid=')) {
        // Extract gameid
        const gameIdMatch = line.match(/gameid=(\d+)/);
        if (!gameIdMatch) continue;
        const gameId = gameIdMatch[1];
        
        // Extract odds (juice values)
        const overJuiceMatch = line.match(/newoverjuice=(-?\d+\.?\d*)/);
        const underJuiceMatch = line.match(/newunderjuice=(-?\d+\.?\d*)/);
        if (!overJuiceMatch || !underJuiceMatch) continue;
        
        const overJuice = parseFloat(overJuiceMatch[1]);
        const underJuice = parseFloat(underJuiceMatch[1]);
        
        // Extract line values
        const overLineMatch = line.match(/newover=(-?\d+\.?\d*)/);
        const underLineMatch = line.match(/newunder=(-?\d+\.?\d*)/);
        if (!overLineMatch || !underLineMatch) continue;
        
        const overLine = parseFloat(overLineMatch[1]);
        const underLine = parseFloat(underLineMatch[1]);
        
        // Extract bookieid
        const bookieIdMatch = line.match(/bookieid=(\d+)/);
        if (!bookieIdMatch) continue;
        const bookieId = parseInt(bookieIdMatch[1]);
        
        const exchange = BOOKIE_TO_EXCHANGE[bookieId] || 'Other';
        
        // Store as a single entry with both Over and Under data
        oddsData.push({
          messageType: 'LineChangeTotal',
          gameId: gameId,
          overLine: overLine,
          underLine: underLine,
          overJuice: overJuice,
          underJuice: underJuice,
          bookieId: bookieId,
          exchange: exchange,
        });
      }
    }
  }
  
  return oddsData;
}

// Generate odds for matched props (since actual odds aren't in the data)
// This uses realistic odds based on prop type and typical market values
function generateOddsForProp(propType, line) {
  // Generate realistic odds based on prop type
  // These are mock but realistic for the PoC
  const baseOdds = {
    'Pass Yds': -120,
    'Rec Yds': -110,
    'Rush Yds': -115,
    'Rec': -105,
    'Pass Comp': -110,
    'INT': -110,
    'Pass TDs': -115,
  };
  
  const base = baseOdds[propType] || -110;
  
  // Add some variance to make it realistic
  const variance = Math.floor(Math.random() * 30) - 15; // -15 to +15
  const odds = base + variance;
  
  // Generate multiple exchanges
  const exchanges = ['ProphetX', 'Novig', 'Other'];
  const bookieIds = [807, 624, 937];
  
  return exchanges.map((exchange, idx) => ({
    odds: odds + (Math.floor(Math.random() * 10) - 5), // Small variance per exchange
    exchange: exchange,
    bookieId: bookieIds[idx],
  }));
}

// Match SpankOdds prop definitions with actual odds data
// Since game IDs don't match, we'll match by player name and prop type with Splash props to get lines,
// then find odds that match the line value
function matchSpankOddsPropsWithOdds(spankOddsProps, oddsData, splashProps) {
  const matchedData = [];
  
  for (const spankProp of spankOddsProps) {
    const normalizedSpankPlayer = normalizePlayerName(spankProp.playerName);
    const normalizedSpankType = normalizePropType(spankProp.propType);
    
    // First, find matching Splash prop to get the line value
    const matchingSplash = splashProps.find(splash => {
      const normalizedSplashPlayer = normalizePlayerName(splash.entity_name);
      const normalizedSplashType = normalizePropType(splash.type_display);
      
      return normalizedSplashPlayer === normalizedSpankPlayer &&
             normalizedSplashType === normalizedSpankType;
    });
    
    if (matchingSplash) {
      // Now find odds that match this line (within 0.5 points tolerance)
      // Look for LineChangeTotal messages that have a line close to the Splash line
      const matchingOdds = oddsData.filter(odds => {
        if (odds.messageType !== 'LineChangeTotal') return false;
        
        // Check if the over or under line matches (within 0.5)
        const overMatch = Math.abs(odds.overLine - matchingSplash.line) < 0.5;
        const underMatch = Math.abs(odds.underLine - matchingSplash.line) < 0.5;
        
        return overMatch || underMatch;
      });
      
      // Determine which side (over/under) matches the Splash line exactly
      matchingOdds.forEach(odds => {
        const overLineMatch = Math.abs(odds.overLine - matchingSplash.line) < 0.5;
        const underLineMatch = Math.abs(odds.underLine - matchingSplash.line) < 0.5;
        
        // Determine which side to use based on exact line matching
        let side = null;
        let oddsValue = null;
        
        if (overLineMatch && !underLineMatch) {
          // Over line matches exactly - this is an OVER bet
          side = 'over';
          oddsValue = odds.overJuice;
        } else if (underLineMatch && !overLineMatch) {
          // Under line matches exactly - this is an UNDER bet
          side = 'under';
          oddsValue = odds.underJuice;
        } else if (overLineMatch && underLineMatch) {
          // Both lines match (shouldn't happen, but handle it)
          // Use the one that's closer
          const overDistance = Math.abs(odds.overLine - matchingSplash.line);
          const underDistance = Math.abs(odds.underLine - matchingSplash.line);
          
          if (overDistance <= underDistance) {
            side = 'over';
            oddsValue = odds.overJuice;
          } else {
            side = 'under';
            oddsValue = odds.underJuice;
          }
        }
        
        // Only add if we determined a side
        if (side && oddsValue !== null) {
          matchedData.push({
            playerName: spankProp.playerName,
            propType: spankProp.propType,
            line: matchingSplash.line,
            side: side, // Track which side (over/under)
            odds: oddsValue,
            exchange: odds.exchange,
            bookieId: odds.bookieId,
          });
        }
      });
    }
  }
  
  return matchedData;
}

// Legacy function - kept for backward compatibility
function generateMockSpankOddsData() {
  // Common NCAAF players from Splash data with realistic odds
  // These represent what would be extracted from SpankOdds files
  const mockData = [
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
    
    // Romello Brinson - Rec Yds 49.5
    { playerName: 'Romello Brinson', propType: 'Rec Yds', line: 49.5, odds: -110, exchange: 'ProphetX', bookieId: 807 },
    
    // Chase Roberts - Rec Yds 60.5
    { playerName: 'Chase Roberts', propType: 'Rec Yds', line: 60.5, odds: -105, exchange: 'ProphetX', bookieId: 807 },
    
    // Parker Kingston - Rec Yds 52.5
    { playerName: 'Parker Kingston', propType: 'Rec Yds', line: 52.5, odds: -100, exchange: 'ProphetX', bookieId: 807 },
    
    // Fernando Mendoza - Pass Yds 238.5
    { playerName: 'Fernando Mendoza', propType: 'Pass Yds', line: 238.5, odds: -125, exchange: 'ProphetX', bookieId: 807 },
    { playerName: 'Fernando Mendoza', propType: 'Pass Yds', line: 238.5, odds: -130, exchange: 'Novig', bookieId: 624 },
    
    // Roman Hemby - Rush Yds 66.5
    { playerName: 'Roman Hemby', propType: 'Rush Yds', line: 66.5, odds: -115, exchange: 'ProphetX', bookieId: 807 },
    
    // Kaytron Allen - Rush Yds 70.5
    { playerName: 'Kaytron Allen', propType: 'Rush Yds', line: 70.5, odds: -120, exchange: 'ProphetX', bookieId: 807 },
    
    // Gunner Stockton - Pass Yds 235.5
    { playerName: 'Gunner Stockton', propType: 'Pass Yds', line: 235.5, odds: -110, exchange: 'ProphetX', bookieId: 807 },
    
    // Blake Shapen - Pass Yds 225.5
    { playerName: 'Blake Shapen', propType: 'Pass Yds', line: 225.5, odds: -115, exchange: 'ProphetX', bookieId: 807 },
    
    // Zachariah Branch - Rec Yds 68.5
    { playerName: 'Zachariah Branch', propType: 'Rec Yds', line: 68.5, odds: -105, exchange: 'ProphetX', bookieId: 807 },
  ];

  return mockData;
}

// Match Splash props with SpankOdds data
function matchProps(splashProps, spankOddsProps) {
  const merged = [];

  for (const splashProp of splashProps) {
    const normalizedPlayer = normalizePlayerName(splashProp.entity_name);
    const normalizedType = normalizePropType(splashProp.type_display);

    // Find matching SpankOdds props
    const matches = spankOddsProps.filter(spank => {
      const normalizedSpankPlayer = normalizePlayerName(spank.playerName);
      const normalizedSpankType = normalizePropType(spank.propType);
      
      // Match by player name and prop type (line should be close)
      return normalizedSpankPlayer === normalizedPlayer &&
             normalizedSpankType === normalizedType &&
             Math.abs(spank.line - splashProp.line) < 1.0; // Allow 1 point variance
    });

    if (matches.length > 0) {
      // Group odds by bookie ID (individual books)
      // Now we need to handle side information
      const oddsByBookie = {};
      const sideByBookie = {}; // Track which side each bookie has
      
      matches.forEach(match => {
        const bookieId = match.bookieId;
        const side = match.side || 'unknown'; // Get side from match
        
        if (!oddsByBookie[bookieId]) {
          oddsByBookie[bookieId] = [];
          sideByBookie[bookieId] = side; // Store side for this bookie
        }
        oddsByBookie[bookieId].push(match.odds);
        
        // If we have conflicting sides for the same bookie, use the most common one
        if (sideByBookie[bookieId] !== side && side !== 'unknown') {
          // Count sides for this bookie
          const sidesForBookie = matches.filter(m => m.bookieId === bookieId).map(m => m.side);
          const overCount = sidesForBookie.filter(s => s === 'over').length;
          const underCount = sidesForBookie.filter(s => s === 'under').length;
          sideByBookie[bookieId] = overCount >= underCount ? 'over' : 'under';
        }
      });
      
      // Calculate average per bookie (if multiple odds from same bookie)
      const oddsByBookieAvg = {};
      const sideByBookieFinal = {};
      Object.keys(oddsByBookie).forEach(bookieId => {
        const odds = oddsByBookie[bookieId];
        oddsByBookieAvg[bookieId] = Math.round(
          odds.reduce((sum, o) => sum + o, 0) / odds.length
        );
        sideByBookieFinal[bookieId] = sideByBookie[bookieId] || 'unknown';
      });
      
      // Also group by exchange for backward compatibility
      const oddsByExchange = {};
      matches.forEach(match => {
        const exchange = match.exchange || 'Other';
        if (!oddsByExchange[exchange]) {
          oddsByExchange[exchange] = [];
        }
        oddsByExchange[exchange].push(match.odds);
      });
      
      const oddsByExchangeAvg = {};
      Object.keys(oddsByExchange).forEach(exchange => {
        const odds = oddsByExchange[exchange];
        oddsByExchangeAvg[exchange] = Math.round(
          odds.reduce((sum, o) => sum + o, 0) / odds.length
        );
      });
      
      // Calculate overall average across all books
      const allOdds = matches.map(m => m.odds);
      const avgOdds = Math.round(allOdds.reduce((sum, o) => sum + o, 0) / allOdds.length);
      const winProb = calculateWinProbability(avgOdds) * 100;
      
      // Get unique exchanges and bookie IDs
      const exchanges = [...new Set(matches.map(m => m.exchange))];
      const bookieIds = [...new Set(matches.map(m => m.bookieId))];
      
      // Determine primary side (most common side across all matches)
      const allSides = matches.map(m => m.side).filter(s => s && s !== 'unknown');
      const overCount = allSides.filter(s => s === 'over').length;
      const underCount = allSides.filter(s => s === 'under').length;
      const primarySide = overCount >= underCount ? 'over' : (underCount > 0 ? 'under' : null);

      merged.push({
        id: splashProp.id,
        entity_name: splashProp.entity_name,
        type_display: splashProp.type_display,
        line: splashProp.line,
        average_odds: avgOdds,
        win_probability: Math.round(winProb * 100) / 100,
        odds_by_bookie: oddsByBookieAvg, // Store odds per bookie ID
        side_by_bookie: sideByBookieFinal, // Store side (over/under) per bookie
        odds_by_exchange: oddsByExchangeAvg, // Keep for backward compatibility
        primary_side: primarySide, // Primary side for this prop
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
        odds_by_bookie: {}, // Empty object for unmatched props
        side_by_bookie: {}, // Empty object for unmatched props
        odds_by_exchange: {}, // Empty object for unmatched props
        primary_side: null,
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
  const outputDir = path.join(__dirname, '../frontend/src/assets/data');

  // Parse data
  console.log('Parsing Splash props CSV...');
  const splashProps = parseSplashProps(splashCsvPath);
  console.log(`Found ${splashProps.length} Splash props\n`);

  // Parse actual SpankOdds data from new capture
  const spankOddsDataDir = path.join(__dirname, '../frontend/src/assets/data/spank_odds_capture');
  const initGameMesgsPath = path.join(spankOddsDataDir, 'initGameMesgs.txt');
  
  console.log('Parsing SpankOdds player prop definitions...');
  const spankOddsPropDefs = parseSpankOddsProps(initGameMesgsPath);
  console.log(`Found ${spankOddsPropDefs.length} player prop definitions in SpankOdds\n`);
  
  console.log('Parsing SpankOdds odds data from numbered files...');
  const oddsData = parseSpankOddsOdds(spankOddsDataDir);
  console.log(`Found ${oddsData.length} odds entries in SpankOdds files\n`);
  
  // Get all unique bookie IDs from the odds data (all individual books)
  const allBookieIdsSet = new Set();
  oddsData.forEach(odds => {
    if (odds.bookieId) {
      allBookieIdsSet.add(odds.bookieId);
    }
  });
  const allBookieIds = Array.from(allBookieIdsSet).map(id => parseInt(id)).sort((a, b) => a - b);
  
  // Also get exchanges for reference
  const allExchangesSet = new Set();
  oddsData.forEach(odds => {
    if (odds.exchange) {
      allExchangesSet.add(odds.exchange);
    }
  });
  const allExchanges = Array.from(allExchangesSet).sort((a, b) => {
    const order = ['ProphetX', 'Novig'];
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
  
  console.log(`Found ${allBookieIds.length} unique bookie IDs: ${allBookieIds.join(', ')}`);
  console.log(`Found ${allExchanges.length} unique exchanges: ${allExchanges.join(', ')}\n`);
  
  console.log('Matching prop definitions with odds data (by player name and line)...');
  // Match prop definitions with actual odds using player names and line values
  const spankOddsProps = matchSpankOddsPropsWithOdds(spankOddsPropDefs, oddsData, splashProps);
  console.log(`Matched ${spankOddsProps.length} SpankOdds props with actual odds\n`);

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
  console.log('Player'.padEnd(25) + ' | ' + 'Prop Type'.padEnd(15) + ' | ' + 'Line'.padStart(6) + ' | ' + 'Avg Odds'.padStart(8) + ' | ' + 'Win %'.padStart(6) + ' | Exchanges');
  console.log('-'.repeat(100));

  matchedProps.forEach(prop => {
    const exchangesStr = prop.exchanges.join(', ') || 'None';
    console.log(
      prop.entity_name.padEnd(25) + ' | ' +
      prop.type_display.padEnd(15) + ' | ' +
      prop.line.toString().padStart(6) + ' | ' +
      prop.average_odds.toString().padStart(8) + ' | ' +
      prop.win_probability.toFixed(2).padStart(6) + '% | ' +
      exchangesStr
    );
  });

  // Build bookie ID to exchange mapping for frontend
  const bookieToExchangeMap = {};
  oddsData.forEach(odds => {
    if (odds.bookieId && odds.exchange) {
      bookieToExchangeMap[odds.bookieId] = odds.exchange;
    }
  });
  
  // Write to JSON file with metadata
  const outputPath = path.join(outputDir, 'merged_props.json');
  const outputData = {
    metadata: {
      all_available_bookie_ids: allBookieIds, // Include all bookie IDs (individual books)
      all_available_exchanges: allExchanges, // Include all exchanges from odds data
      bookie_to_exchange: bookieToExchangeMap, // Mapping of bookie ID to exchange name
      total_splash_props: splashProps.length,
      matched_props: matchedProps.length,
      generated_at: new Date().toISOString()
    },
    props: matchedProps
  };
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n\n✅ Results written to: ${outputPath}`);

  // Write to CSV for easy viewing
  const csvPath = path.join(outputDir, 'merged_props.csv');
  let csv = 'Player,Prop Type,Splash Line,Average Odds,Win %,Exchanges\n';
  matchedProps.forEach(prop => {
    csv += `"${prop.entity_name}","${prop.type_display}",${prop.line},${prop.average_odds},${prop.win_probability.toFixed(2)},${prop.exchanges.join(';')}\n`;
  });
  fs.writeFileSync(csvPath, csv);
  console.log(`✅ Results also written to CSV: ${csvPath}`);

  console.log('\n✅ Integration complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Total Splash props: ${splashProps.length}`);
  console.log(`   - Matched props: ${matchedProps.length}`);
  console.log(`   - Match rate: ${((matchedProps.length / splashProps.length) * 100).toFixed(1)}%`);
  console.log(`   - Highest win %: ${matchedProps[0]?.win_probability.toFixed(2)}% (${matchedProps[0]?.entity_name})`);
}

// Run if executed directly
if (require.main === module) {
  integrateData();
}

module.exports = { integrateData, parseSplashProps, generateMockSpankOddsData, matchProps };

