# SpankOdds + Splash Props Integration - Proof of Concept

## Overview

This integration automatically merges SpankOdds market odds data with Splash props information to create a mockup dataset that eliminates manual data entry bottlenecks.

## What Was Built

### 1. Data Integration Script (`scripts/integrate-data.js`)

A Node.js script that:
- ✅ Parses Splash props CSV (`frontend/src/assets/data/splash_props_all.csv`)
- ✅ Generates/parses SpankOdds player prop data (mock data for PoC)
- ✅ Matches props by player name and prop type
- ✅ Calculates average odds across exchanges
- ✅ Converts odds to win probabilities
- ✅ Sorts by win % descending (highest first)
- ✅ Filters to show only matched props
- ✅ Outputs merged data as JSON and CSV

### 2. Updated PropsService (`frontend/src/app/services/props.ts`)

- Added `getMergedProps()` method to load the integrated dataset
- Maintains backward compatibility with existing mock data

### 3. Updated Dashboard (`frontend/src/app/components/dashboard/`)

- Loads merged data automatically (set `useMergedData = true`)
- Displays win probability column
- Sorts by win % descending by default
- Shows exchanges automatically from merged data
- Highlights value plays (≥57% win probability ≈ -135 odds)

## Running the Integration

### Step 1: Generate Merged Dataset

```bash
cd scripts
node integrate-data.js
```

This will:
- Read Splash props from `frontend/src/assets/data/splash_props_all.csv`
- Generate mock SpankOdds data (for PoC)
- Match and merge the data
- Output to:
  - `frontend/src/assets/data/merged_props.json`
  - `frontend/src/assets/data/merged_props.csv`

### Step 2: View Results

The dashboard automatically loads the merged data when `useMergedData = true` in `dashboard.ts`.

## Output Format

The merged dataset includes:

```json
{
  "id": "prop_690a28dd462e7a3877bca072c8f2d70b",
  "entity_name": "Turbo Richard",
  "type_display": "Rush Yds",
  "line": 49.5,
  "average_odds": -137,
  "win_probability": 57.89,
  "exchanges": ["ProphetX", "Novig"],
  "bookieIds": [807, 624],
  "matched": true
}
```

## Key Features

### ✅ Fully Automated
- No manual data entry
- No copy-paste workflows
- Automatic matching and calculation

### ✅ Win Probability Calculation
- Converts American odds to implied win percentages
- Example: -135 odds = ~57% win probability

### ✅ Automatic Sorting
- Primary sort by win % descending (highest first)
- Ready for immediate betting decisions

### ✅ Exchange Tracking
- Automatically tracks which exchanges provided odds
- Identifies ProphetX and Novig (higher liquidity)

### ✅ Filtering
- Shows only props available at Splash Sports
- Filters by exchange if needed

## Current PoC Results

From the test run:
- **Total Splash props**: 1,848
- **Matched props**: 19
- **Highest win %**: 57.89% (Turbo Richard - Rush Yds 49.5)
- **Average odds range**: -100 to -140

## Next Steps for Production

1. **Parse Real SpankOdds Data**: Replace mock data generator with actual parser for SpankOdds text files
2. **Real-time Updates**: Set up automated data refresh from SpankOdds API/feed
3. **Better Matching**: Improve player name normalization and prop type matching
4. **Line Variance**: Handle cases where Splash and SpankOdds lines differ slightly
5. **Multiple Exchanges**: Aggregate odds from all available exchanges automatically

## Files Created/Modified

### New Files
- `scripts/integrate-data.js` - Main integration script
- `scripts/integrate-data.ts` - TypeScript version (for future use)
- `scripts/package.json` - Script dependencies
- `frontend/src/assets/data/merged_props.json` - Generated merged dataset
- `frontend/src/assets/data/merged_props.csv` - Generated CSV export

### Modified Files
- `frontend/src/app/services/props.ts` - Added `getMergedProps()` method
- `frontend/src/app/components/dashboard/dashboard.ts` - Load merged data, sort by win %
- `frontend/src/app/components/dashboard/dashboard.html` - Added Win % column
- `frontend/tsconfig.json` - Added `resolveJsonModule` for JSON imports

## Philosophy

This PoC eliminates the previous manual bottleneck:
- ❌ **Old**: Pete manually checks Unabated for each prop
- ❌ **Old**: Pete manually calculates weighted averages
- ❌ **Old**: Pete manually filters for good plays

- ✅ **New**: SpankOdds data pulled automatically
- ✅ **New**: Merged with Splash props automatically
- ✅ **New**: Win probabilities calculated automatically
- ✅ **New**: Sorted and filtered automatically
- ✅ **New**: Results ready for betting immediately

## Notes

- The current implementation uses mock SpankOdds data for the PoC
- In production, you'll need to parse the actual SpankOdds message format from the text files
- The matching algorithm allows 1.0 point variance in lines between sources
- Win probability threshold of 57% corresponds to approximately -135 odds

