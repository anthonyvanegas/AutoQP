const fs = require('fs');
const path = require('path');

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
  604: 'Other',
  605: 'Other',
  721: 'Other',
  973: 'Other',
  805: 'Other',
  460: 'Other',
  811: 'Other',
  802: 'Other',
  457: 'Other',
  846: 'Other',
  898: 'Other',
  444: 'Other',
};

// Parse player prop definitions from initGameMesgs.txt
function parsePropDefinitions(initGameMesgsPath) {
  const content = fs.readFileSync(initGameMesgsPath, 'utf-8');
  const lines = content.split('\n');
  const props = [];
  
  for (const line of lines) {
    if (!line.includes('~') || line.includes('<table') || line.includes('</table')) {
      continue;
    }
    
    const parts = line.split('~');
    if (parts.length < 10) continue;
    
    const field7 = parts[7]?.trim();
    const field8 = parts[8]?.trim();
    const field9 = parts[9]?.trim();
    const field10 = parts[10]?.trim();
    
    // Player props have: Player Name, Prop Type, Over, Under
    if (field9 === 'Over' && field10 === 'Under' && field7 && field8) {
      const playerName = field7;
      const propType = field8;
      const gameId1 = parts[0]?.trim();
      const gameId2 = parts[1]?.trim();
      const gameId3 = parts[2]?.trim();
      
      // Extract parent game IDs (last fields before null)
      const parentGameId1 = parts[parts.length - 6]?.trim();
      const parentGameId2 = parts[parts.length - 5]?.trim();
      
      props.push({
        gameId1: gameId1,
        gameId2: gameId2,
        gameId3: gameId3,
        parentGameId1: parentGameId1,
        parentGameId2: parentGameId2,
        playerName: playerName,
        propType: propType,
        rawLine: line,
      });
    }
  }
  
  return props;
}

// Parse all odds data from numbered files
function parseOddsData(dataDir) {
  const oddsData = [];
  const files = ['0.txt', '1.txt', '2.txt'];
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) continue;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (!line.includes('messageType=')) continue;
      
      // Parse LineChangeTotal messages
      if (line.includes('messageType=LineChangeTotal') && line.includes('gameid=')) {
        const gameIdMatch = line.match(/gameid=(\d+)/);
        if (!gameIdMatch) continue;
        const gameId = gameIdMatch[1];
        
        const overJuiceMatch = line.match(/newoverjuice=(-?\d+\.?\d*)/);
        const underJuiceMatch = line.match(/newunderjuice=(-?\d+\.?\d*)/);
        const overLineMatch = line.match(/newover=(-?\d+\.?\d*)/);
        const underLineMatch = line.match(/newunder=(-?\d+\.?\d*)/);
        const bookieIdMatch = line.match(/bookieid=(\d+)/);
        const periodMatch = line.match(/period=(\d+)/);
        const timestampMatch = line.match(/^(\d+)/);
        
        if (overJuiceMatch && underJuiceMatch && overLineMatch && underLineMatch && bookieIdMatch) {
          const bookieId = parseInt(bookieIdMatch[1]);
          const exchange = BOOKIE_TO_EXCHANGE[bookieId] || 'Unknown';
          
          oddsData.push({
            messageType: 'LineChangeTotal',
            gameId: gameId,
            period: periodMatch ? parseInt(periodMatch[1]) : null,
            timestamp: timestampMatch ? parseInt(timestampMatch[1]) : null,
            overJuice: parseFloat(overJuiceMatch[1]),
            underJuice: parseFloat(underJuiceMatch[1]),
            overLine: parseFloat(overLineMatch[1]),
            underLine: parseFloat(underLineMatch[1]),
            bookieId: bookieId,
            exchange: exchange,
            sourceFile: file,
            rawLine: line.substring(0, 200), // First 200 chars for debugging
          });
        }
      }
      
      // Parse LineChangeSpread messages
      if (line.includes('messageType=LineChangeSpread') && line.includes('gameid=')) {
        const gameIdMatch = line.match(/gameid=(\d+)/);
        if (!gameIdMatch) continue;
        const gameId = gameIdMatch[1];
        
        const visitorJuiceMatch = line.match(/newvisitorjuice=(-?\d+\.?\d*)/);
        const homeJuiceMatch = line.match(/newhomejuice=(-?\d+\.?\d*)/);
        const visitorSpreadMatch = line.match(/newvisitorspread=(-?\d+\.?\d*)/);
        const homeSpreadMatch = line.match(/newhomespread=(-?\d+\.?\d*)/);
        const bookieIdMatch = line.match(/bookieid=(\d+)/);
        const periodMatch = line.match(/period=(\d+)/);
        const timestampMatch = line.match(/^(\d+)/);
        
        if (visitorJuiceMatch && homeJuiceMatch && visitorSpreadMatch && homeSpreadMatch && bookieIdMatch) {
          const bookieId = parseInt(bookieIdMatch[1]);
          const exchange = BOOKIE_TO_EXCHANGE[bookieId] || 'Unknown';
          
          oddsData.push({
            messageType: 'LineChangeSpread',
            gameId: gameId,
            period: periodMatch ? parseInt(periodMatch[1]) : null,
            timestamp: timestampMatch ? parseInt(timestampMatch[1]) : null,
            visitorJuice: parseFloat(visitorJuiceMatch[1]),
            homeJuice: parseFloat(homeJuiceMatch[1]),
            visitorSpread: parseFloat(visitorSpreadMatch[1]),
            homeSpread: parseFloat(homeSpreadMatch[1]),
            bookieId: bookieId,
            exchange: exchange,
            sourceFile: file,
            rawLine: line.substring(0, 200),
          });
        }
      }
      
      // Parse LineChangeMoney messages
      if (line.includes('messageType=LineChangeMoney') && line.includes('gameid=')) {
        const gameIdMatch = line.match(/gameid=(\d+)/);
        if (!gameIdMatch) continue;
        const gameId = gameIdMatch[1];
        
        const visitorJuiceMatch = line.match(/newvisitorjuice=(-?\d+\.?\d*)/);
        const homeJuiceMatch = line.match(/newhomejuice=(-?\d+\.?\d*)/);
        const bookieIdMatch = line.match(/bookieid=(\d+)/);
        const periodMatch = line.match(/period=(\d+)/);
        const timestampMatch = line.match(/^(\d+)/);
        
        if (visitorJuiceMatch && homeJuiceMatch && bookieIdMatch) {
          const bookieId = parseInt(bookieIdMatch[1]);
          const exchange = BOOKIE_TO_EXCHANGE[bookieId] || 'Unknown';
          
          oddsData.push({
            messageType: 'LineChangeMoney',
            gameId: gameId,
            period: periodMatch ? parseInt(periodMatch[1]) : null,
            timestamp: timestampMatch ? parseInt(timestampMatch[1]) : null,
            visitorJuice: parseFloat(visitorJuiceMatch[1]),
            homeJuice: parseFloat(homeJuiceMatch[1]),
            bookieId: bookieId,
            exchange: exchange,
            sourceFile: file,
            rawLine: line.substring(0, 200),
          });
        }
      }
      
      // Parse LineChangeTeamTotal messages
      if (line.includes('messageType=LineChangeTeamTotal') && line.includes('gameid=')) {
        const gameIdMatch = line.match(/gameid=(\d+)/);
        if (!gameIdMatch) continue;
        const gameId = gameIdMatch[1];
        
        const visitorOverJuiceMatch = line.match(/newvisitoroverjuice=(-?\d+\.?\d*)/);
        const visitorUnderJuiceMatch = line.match(/newvisitorunderjuice=(-?\d+\.?\d*)/);
        const homeOverJuiceMatch = line.match(/newhomeoverjuice=(-?\d+\.?\d*)/);
        const homeUnderJuiceMatch = line.match(/newhomeunderjuice=(-?\d+\.?\d*)/);
        const visitorOverMatch = line.match(/newvisitorover=(-?\d+\.?\d*)/);
        const visitorUnderMatch = line.match(/newvisitorunder=(-?\d+\.?\d*)/);
        const homeOverMatch = line.match(/newhomeover=(-?\d+\.?\d*)/);
        const homeUnderMatch = line.match(/newhomeunder=(-?\d+\.?\d*)/);
        const bookieIdMatch = line.match(/bookieid=(\d+)/);
        const periodMatch = line.match(/period=(\d+)/);
        const timestampMatch = line.match(/^(\d+)/);
        
        if (bookieIdMatch) {
          const bookieId = parseInt(bookieIdMatch[1]);
          const exchange = BOOKIE_TO_EXCHANGE[bookieId] || 'Unknown';
          
          oddsData.push({
            messageType: 'LineChangeTeamTotal',
            gameId: gameId,
            period: periodMatch ? parseInt(periodMatch[1]) : null,
            timestamp: timestampMatch ? parseInt(timestampMatch[1]) : null,
            visitorOverJuice: visitorOverJuiceMatch ? parseFloat(visitorOverJuiceMatch[1]) : null,
            visitorUnderJuice: visitorUnderJuiceMatch ? parseFloat(visitorUnderJuiceMatch[1]) : null,
            homeOverJuice: homeOverJuiceMatch ? parseFloat(homeOverJuiceMatch[1]) : null,
            homeUnderJuice: homeUnderJuiceMatch ? parseFloat(homeUnderJuiceMatch[1]) : null,
            visitorOver: visitorOverMatch ? parseFloat(visitorOverMatch[1]) : null,
            visitorUnder: visitorUnderMatch ? parseFloat(visitorUnderMatch[1]) : null,
            homeOver: homeOverMatch ? parseFloat(homeOverMatch[1]) : null,
            homeUnder: homeUnderMatch ? parseFloat(homeUnderMatch[1]) : null,
            bookieId: bookieId,
            exchange: exchange,
            sourceFile: file,
            rawLine: line.substring(0, 200),
          });
        }
      }
    }
  }
  
  return oddsData;
}

// Main parsing function
function parseSpankOddsData() {
  console.log('Parsing SpankOdds data...\n');
  
  const dataDir = path.join(__dirname, '../frontend/src/assets/data/spank_odds_capture');
  const initGameMesgsPath = path.join(dataDir, 'initGameMesgs.txt');
  const outputPath = path.join(__dirname, '../frontend/src/assets/data/spank_odds_parsed.json');
  
  // Parse prop definitions
  console.log('Parsing player prop definitions from initGameMesgs.txt...');
  const propDefinitions = parsePropDefinitions(initGameMesgsPath);
  console.log(`Found ${propDefinitions.length} player prop definitions\n`);
  
  // Parse odds data
  console.log('Parsing odds data from numbered files...');
  const oddsData = parseOddsData(dataDir);
  console.log(`Found ${oddsData.length} odds entries\n`);
  
  // Group odds by game ID for easier lookup
  const oddsByGameId = {};
  oddsData.forEach(odds => {
    if (!oddsByGameId[odds.gameId]) {
      oddsByGameId[odds.gameId] = [];
    }
    oddsByGameId[odds.gameId].push(odds);
  });
  
  // Create summary statistics
  const stats = {
    totalPropDefinitions: propDefinitions.length,
    totalOddsEntries: oddsData.length,
    uniqueGameIdsInOdds: Object.keys(oddsByGameId).length,
    uniqueGameIdsInProps: new Set([
      ...propDefinitions.map(p => p.gameId1),
      ...propDefinitions.map(p => p.gameId2),
      ...propDefinitions.map(p => p.parentGameId1),
      ...propDefinitions.map(p => p.parentGameId2),
    ].filter(Boolean)).size,
    messageTypes: {},
    exchanges: {},
  };
  
  oddsData.forEach(odds => {
    stats.messageTypes[odds.messageType] = (stats.messageTypes[odds.messageType] || 0) + 1;
    stats.exchanges[odds.exchange] = (stats.exchanges[odds.exchange] || 0) + 1;
  });
  
  // Check for matches
  const propGameIds = new Set([
    ...propDefinitions.map(p => p.gameId1),
    ...propDefinitions.map(p => p.gameId2),
  ].filter(Boolean));
  
  const oddsGameIds = new Set(Object.keys(oddsByGameId));
  const matchingGameIds = [...propGameIds].filter(id => oddsGameIds.has(id));
  
  stats.matchingGameIds = matchingGameIds.length;
  stats.propGameIdsNotInOdds = [...propGameIds].filter(id => !oddsGameIds.has(id)).slice(0, 10);
  stats.oddsGameIdsNotInProps = [...oddsGameIds].filter(id => !propGameIds.has(id)).slice(0, 10);
  
  // Create output structure
  const output = {
    metadata: {
      parsedAt: new Date().toISOString(),
      sourceDirectory: dataDir,
      stats: stats,
    },
    propDefinitions: propDefinitions,
    oddsData: oddsData,
    oddsByGameId: oddsByGameId,
  };
  
  // Write to JSON file
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✅ Parsed data written to: ${outputPath}\n`);
  
  // Print summary
  console.log('📊 Summary:');
  console.log(`   - Player prop definitions: ${stats.totalPropDefinitions}`);
  console.log(`   - Total odds entries: ${stats.totalOddsEntries}`);
  console.log(`   - Unique game IDs in odds: ${stats.uniqueGameIdsInOdds}`);
  console.log(`   - Unique game IDs in props: ${stats.uniqueGameIdsInProps}`);
  console.log(`   - Matching game IDs: ${stats.matchingGameIds}`);
  console.log(`\n   Message Types:`);
  Object.entries(stats.messageTypes).forEach(([type, count]) => {
    console.log(`     - ${type}: ${count}`);
  });
  console.log(`\n   Exchanges:`);
  Object.entries(stats.exchanges).forEach(([exchange, count]) => {
    console.log(`     - ${exchange}: ${count}`);
  });
  
  if (stats.matchingGameIds === 0) {
    console.log(`\n⚠️  WARNING: No matching game IDs found between prop definitions and odds data!`);
    console.log(`   Sample prop game IDs not in odds: ${stats.propGameIdsNotInOdds.slice(0, 5).join(', ')}`);
    console.log(`   Sample odds game IDs not in props: ${stats.oddsGameIdsNotInProps.slice(0, 5).join(', ')}`);
  }
  
  return output;
}

// Run if executed directly
if (require.main === module) {
  parseSpankOddsData();
}

module.exports = { parseSpankOddsData, parsePropDefinitions, parseOddsData };

