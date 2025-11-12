  1	# SplashProps Dashboard - Project Reference
     2	
     3	## Project Overview
     4	Building an automated dashboard for SplashProps betting analysis to replace the current manual workflow and identify value betting opportunities.
     5	
     6	## The Betting Strategy Explained
     7	
     8	### How Splash Sports Works
     9	- **All props are 50/50 bets** - no juice, even money
    10	- Example: Pascal Siakam Pts+Reb+Asts Over/Under 39.5
    11	- User picks Over or Under - if correct, they win even money
    12	- Splash does NOT provide odds - everything is treated as 50/50
    13	
    14	### The Market Edge
    15	- Traditional sportsbooks show "real" market odds via Unabated/SpankOdds
    16	- Example: Market shows -135 odds (~57% implied win probability)
    17	- This reveals which side the market thinks is more likely to hit
    18	- **The opportunity:** Find props where market is lopsided (57%+ win rate) but Splash offers at 50/50
    19	
    20	### Key Insight
    21	> "We're trying to find the available Splash plays (50/50) that have lopsided win% in the market (60/40). -135 is ~57% win%" - Pete
    22	
    23	## Current Workflow (Manual Process → Automated Integration)
    24	1. Braeden pulls all available Splash props from API → CSV export (`splash_props_all.csv`)
    25	2. Scrape SpankOdds for odds data on those props (data snapshots available locally)
    26	3. Integrate SpankOdds odds with Splash props CSV
    27	4. Calculate win probabilities from market odds
    28	5. Sort by highest win % (descending)
    29	6. Filter for plays only available at Splash Sports
    30	7. Identify and place bets on top opportunities
    31	
    32	## Goal
    33	Automate the odds analysis workflow with a dashboard that:
    34	- Displays all Splash props from CSV/API
    35	- Integrates market odds data from SpankOdds 
    36	- Calculates win probabilities from average market odds
    37	- Sorts by highest win % (descending)
    38	- Filters for props only available at Splash Sports
    39	- Highlights top betting opportunities that show market edge
    40	
    41	## Current Status & Data Structure
    42	
    43	### Proof of Concept Phase
    44	**What We Have:**
    45	- ✅ Updated `splash_props_all.csv` - Latest Splash props snapshot from Braeden
    46	- ✅ SpankOdds data snapshot - Available locally (captured simultaneously with Splash props)
    47	- ✅ Automated data integration script (`scripts/integrate-data.js`) - Matches Splash props with SpankOdds odds by player name and line value
    48	- ✅ Dashboard displaying integrated data with 81 individual bookie columns
    49	- ✅ Exchange information displayed next to each bookie ID (ProphetX, Novig, Other)
    50	- ✅ Horizontal scrolling table with sticky columns for key information
    51	- ⏳ Need continuous access to SpankOdds data (currently bottlenecked by manual snapshots)
    52	
    53	**Current Implementation:**
    54	- **Matching Strategy**: Matches props by player name (normalized) and prop type, then finds odds where line values are within 0.5 tolerance
    55	- **Data Structure**: Each prop includes `odds_by_bookie` object mapping bookie IDs to odds values
    56	- **Metadata**: Includes `bookie_to_exchange` mapping for frontend display
    57	- **Match Rate**: ~4.6% (50 matched props from 1081 total Splash props)
    58	- **Display**: All 81 unique bookie IDs shown as individual columns with exchange labels
    59	
    60	**What's Next:**
    61	- Expand bookie-to-exchange mapping (currently only partial mapping - many bookies show as "Other")
    62	- Improve matching accuracy (investigate why match rate is low)
    63	- Validate data alignment between sources
    64	- Once validated, set up server/API for automated continuous scraping
    65	
    66	### Data Integration Plan
    67	1. **Input**: Splash props CSV + SpankOdds odds snapshot
    68	2. **Process**: Match props across datasets, merge odds data
    69	3. **Output**: Single dataset with props and associated market odds
    70	4. **Sorting**: By win % (descending)
    71	5. **Filtering**: Only Splash-available props
    72	
    73	### Future Infrastructure
    74	- Remote server/VM will run continuous SpankOdds scraper
    75	- Scraper updates local text files with latest odds
    76	- Dashboard/application pulls from these local files
    77	- Keeps SpankOdds access isolated and prevents bottleneck
    78	- Enables real-time or near-real-time odds updates
    79	
    80	## Technical Details
    80	
    81	### Data Sources
    81	
    82	#### Splash Sports API
    82	- **Endpoint**: `https://api.splashsports.com/props-service/api/props`
    83	- **Access**: Braeden has existing API access
    84	- **Data Provided**: Player props (player name, prop type, line)
    85	- **What's NOT Provided**: Odds (everything is 50/50 on Splash)
    85	
    86	#### Market Odds Sources
    86	- **Primary Source**: SpankOdds (data scraping, no API cost)
    87	- **Alternative**: Unabated.com (requires login, more difficult to scrape)
    88	- **Current Method**: SpankOdds data snapshots integrated with Splash props CSV
    89	- **Future Plan**: Automated server continuously scrapes SpankOdds data and maintains local text files
    89	
    90	#### Key Exchanges (Higher Liquidity)
    90	- ProphetX
    91	- Novig
    91	- These exchanges have higher liquidity and are weighted heavier in decision-making
    92	
    93	### Existing Code
    92	- **File**: QP.py (Python script)
    93	- **Function**: Fetches data from Splash Sports API and writes to CSV
    94	- **Sample Output**: splash_props_all.csv
    95	- **CSV Structure**: `id, entity_name, type_display, line`
    95	
    96	## Weighted Average Calculation
    96	
    97	### Pete's Approach
    97	- **Method**: Subjective, not scientific
    98	- **Preference**: Weight exchanges heavier based on available liquidity
    99	- **Practical Reality**: "At that point I'd just take an average across the board and just noting the exchanges"
    100	- **Philosophy**: "Doesn't need to be as exact. We just need to be directionally correct"
    100	
    101	### Simplified Requirements
    101	- Simple average across all sportsbooks is acceptable
    102	- Note which exchanges (ProphetX/Novig) are included
    103	- Focus on finding the obvious top plays
    104	- -135 is a **rough cutoff**, not a precise requirement
    105	- "We're looking for the top top plays so it'll be quite easy to see"
    105	
    106	## Solution Requirements
    106	
    107	### Type
    107	- "Crude" solution - simple and functional
    108	- Directionally correct > mathematically precise
    109	- Focus on top plays, not marginal edges
    109	
    110	### Core Features
    110	1. **Display Splash Props** - Show all available props from CSV
    111	2. **SpankOdds Integration** - Pull and sync odds data with Splash props
    112	3. **Win Probability Calculation** - Convert market odds to implied win %
    113	4. **Sorting** - Sort by win % descending (highest win probability first)
    114	5. **Filtering** - Filter for props only available at Splash Sports
    115	6. **Simple Clean UI** - Keep it simple, focus on data clarity
    116	7. **Exchange Notation** - Track which exchanges/books odds came from
    116	
    117	### Nice-to-Have Features
    117	- Bulk import of odds data (if Pete tracks in spreadsheet)
    118	- Historical tracking of plays
    119	- Win/loss tracking
    119	
    120	## Team
    120	- **Pete**: Domain expert, currently handles manual analysis and betting
    121	- **Braeden**: Technical access to Splash API, wrote current Python automation
    122	- **Anthony**: Building the dashboard solution
    122	
    123	## Key Decisions Made
    123	
    124	### Odds Data Source
    124	- **Decision**: SpankOdds (not Unabated, not expensive API)
    125	- **Rationale**: Zero cost, straightforward to scrape, more reliable than manual Unabated checks
    126	- **Current State**: Local SpankOdds data snapshots available; building PoC with test data
    126	
    127	### Data Integration
    127	- **Decision**: Combine SpankOdds odds with Splash props CSV directly
    128	- **Rationale**: Single source of truth, easier to maintain and sync
    129	- **Structure**: Merge odds data into props dataset for single display
    129	
    130	### Automation Approach
    130	- **Decision**: Proof of concept phase first (manual data snapshots)
    131	- **Future**: Automated server-based continuous scraping with local file updates
    132	- **Benefit**: Eliminates manual bottleneck while keeping system isolated and reliable
    132	
    133	### Sorting & Filtering
    133	- **Decision**: Sort by highest win % descending, filter by Splash availability
    134	- **Rationale**: Clearly identifies best opportunities for betting
    135	- **Threshold**: -145 odds is Splash removal threshold (noted for future notifications)
    135	
    136	### Display Approach
    136	- **Decision**: Show individual bookie IDs as columns (81 unique books) with exchange labels
    137	- **Rationale**: Provides granular view of odds across all books, exchange info helps identify liquidity sources
    138	- **Implementation**: Exchange name displayed below bookie ID in column header
    138	
    139	## Open Questions
    139	- ✅ ~~Where do odds come from?~~ → SpankOdds (zero cost, straightforward)
    140	- ✅ ~~Manual Unabated checking?~~ → Using SpankOdds instead
    140	- ⏳ How to provide continuous SpankOdds data access? → Investigating remote VM/server approach
    141	- ⏳ What's the complete SpankOdds data structure for all prop types?
    142	- ⏳ When to implement line movement notifications? (Phase 3, deferred)
    142	- ⏳ Complete bookie-to-exchange mapping? → Currently partial, many bookies show as "Other"
    143	
    144	## Development Phases
    144	
    145	### Phase 0: Proof of Concept (Current)
    145	- [x] Integrate SpankOdds odds data with Splash props CSV
    146	- [x] Calculate win probabilities from SpankOdds market odds
    147	- [x] Sort by highest win % (descending)
    148	- [x] Filter for props only available at Splash Sports
    148	- [x] Display individual bookie IDs as columns (81 unique books)
    149	- [x] Show exchange information next to each bookie ID
    149	- [x] Implement horizontal scrolling for wide table
    150	- [x] Add sticky columns for key information (Player, Prop, Line on left; Average, Win %, Actions on right)
    150	- [ ] Validate data accuracy and completeness
    151	- [ ] Expand bookie-to-exchange mapping
    151	- **Status**: ✅ Core integration complete. Successfully matching 50 props from 1081 Splash props with SpankOdds odds data. Dashboard displays all 81 individual bookie columns with exchange labels. Next: Expand bookie-to-exchange mapping and validate matching accuracy.
    151	
    152	### Phase 1: Basic Dashboard (Next)
    152	- [x] Display Splash props with integrated odds data
    153	- [x] Show calculated win percentages
    154	- [x] Sort and filter functionality
    155	- [x] Bootstrap styling / clean UI
    155	- [x] Simple and focused - no manual entry needed
    155	
    156	### Phase 2: Automated Data Pipeline (Future)
    156	- [ ] Set up remote server/VM for continuous SpankOdds scraping
    157	- [ ] Background process continuously updates local text files with latest odds
    158	- [ ] Dashboard pulls from these local files
    159	- [ ] Eliminates manual data entry and snapshot limitations
    159	
    160	### Phase 3: Line Movement Notifications (Deferred)
    160	- [ ] Implement alerts for odds movement above Splash threshold (-145 odds)
    161	- [ ] Notify when props enter "green territory" (favorable for betting)
    162	- [ ] Track time window between notification and prop delisting
    163	- [ ] SpankBets has specific notification API available for this
    164	- **Note**: Handling this in a future update after PoC validation
    164	
    165	## Notes
    165	- Everything on Splash is 50/50 - no odds provided by platform
    166	- SpankOdds provides market odds that reveal true win probabilities
    167	- Edge exists when market shows 57%+ but Splash offers 50/50
    168	- **Splash Odds Threshold**: Props become unavailable at -145 odds; must catch bets before delisting
    169	- **Current Approach**: Proof of concept with SpankOdds data snapshots
    170	- **Future Approach**: Remote server continuously scrapes SpankOdds → updates local text files → dashboard pulls data
    171	- This keeps SpankOdds scraping isolated while providing reliable data feed
    171	- Directional correctness > mathematical precision
    172	- Focus on obvious top plays with clearest edges
    173	- Line movement notifications will be added once PoC is validated (SpankBets has specific API for this)
    173	
    174	## Implementation Notes (Updated)
    174	
    175	### Data Integration Process
    175	1. **Splash Props Parsing**: Reads CSV with player name, prop type, and line value
    176	2. **SpankOdds Parsing**: 
    177	- Extracts player prop definitions from `initGameMesgs.txt` (player name, prop type, game IDs)
    178	- Parses odds from numbered files (0.txt, 1.txt, 2.txt) containing `LineChangeTotal` messages
    179	- Extracts: gameId, overLine, underLine, overJuice, underJuice, bookieId, exchange
    180	3. **Matching Logic**: 
    181	- Normalizes player names (removes special chars, handles variations)
    182	- Normalizes prop types (maps Splash types to SpankOdds types)
    183	- Matches by player name + prop type, then finds odds where line is within 0.5 tolerance
    184	4. **Data Aggregation**:
    185	- Groups odds by bookie ID (individual books)
    186	- Calculates average odds per bookie (if multiple odds from same bookie)
    187	- Calculates overall average across all books for win probability
    188	- Stores `odds_by_bookie` object for frontend display
    188	
    189	### Dashboard Features
    189	- **Individual Book Columns**: Each of 81 unique bookie IDs displayed as separate column
    190	- **Exchange Labels**: Exchange name (ProphetX, Novig, Other) shown below each bookie ID in header
    190	- **Sticky Columns**: Player, Prop Type, Splash Line stay visible on left; Average, Win %, Actions stay visible on right
    191	- **Horizontal Scrolling**: Table scrolls horizontally to view all 81 book columns
    192	- **Sorting**: By win % descending (highest probability first)
    193	- **Filtering**: Only shows props available at Splash Sports
    193	
    194	### Known Limitations
    194	- **Bookie-to-Exchange Mapping**: Currently only partial - many bookies mapped to "Other" category. Need to expand mapping as bookie identities are discovered.
    195	- **Match Rate**: ~4.6% match rate suggests potential issues with:
    196	- Player name normalization (handling nicknames, variations)
    197	- Prop type matching (different naming conventions)
    198	- Line value tolerance (may need adjustment)
    199	- **Data Freshness**: Currently using snapshot data - need continuous updates for production use
