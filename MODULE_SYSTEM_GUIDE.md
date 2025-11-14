# Module System - Equity & F&O

## Overview

Your accounting system now has a **two-module architecture**:
- **Equity (EQ)**: Cash market stock trading (what we built)
- **F&O**: Futures & Options trading (coming soon)

## What Changed

### 1. Login Flow
```
Before:  Login → Dashboard
Now:     Login → Module Selection → Choose Equity or F&O
```

### 2. New User Experience

1. **Login** with password
2. **See Module Selection Screen** with 2 cards:
   - **Equity (EQ)** - Blue card with stock icon
   - **F&O** - Purple card with chart icon
3. **Click Equity** → Opens the entire system we built
4. **Click F&O** → Shows "Coming Soon" page

### 3. Visual Features

#### Module Selector Screen
- Beautiful gradient background
- 2 large cards showing:
  - Module name and icon
  - Description
  - List of features
  - Action button
- Hover effects with scale and shadow

#### Sidebar Updates
- Blue badge showing "Equity Module" with pulsing dot
- Module switcher icon (⇄) to go back to module selection
- All navigation updated to work with /equity/ routes

### 4. Routing Structure

#### Old Routes (still work, redirect to equity)
```
/dashboard     → /equity/dashboard
/master/party  → /equity/master/party
/trading       → /equity/trading
etc.
```

#### New Routes
```
/                      → /modules (module selection)
/modules               → Module selection screen
/equity/dashboard      → Equity dashboard
/equity/master/party   → Party master
/equity/trading        → Trading page
... (all equity routes)
/fo/dashboard          → F&O coming soon page
```

## File Changes

### New Files Created
1. **`src/pages/ModuleSelector.tsx`** - Module selection screen with 2 cards
2. **`src/pages/FODashboard.tsx`** - F&O "Coming Soon" placeholder
3. **`src/contexts/ModuleContext.tsx`** - Context for tracking current module
4. **`MODULE_SYSTEM_GUIDE.md`** - This guide

### Modified Files
1. **`src/App.tsx`**
   - Added ModuleProvider
   - Updated routing with /equity/ prefix
   - Added /modules route
   - Added /fo/ routes

2. **`src/components/AppSidebar.tsx`**
   - Updated all links with /equity/ prefix
   - Added module indicator badge in header
   - Added module switcher button

3. **`backend/server.js`**
   - Fixed bill item descriptions to show company names
   - Updated `/api/bills/:id/items` to join with company_master

4. **`src/components/BrokerBillView.tsx`**
   - Updated to display stock names instead of "Contract 001"

## How to Use

### For Users

1. **Login** to the system
2. **Select "Equity"** module (the blue card)
3. Work normally - everything works the same
4. **To switch modules**: Click the ⇄ icon in the sidebar header
5. This takes you back to module selection

### For Developers

#### Adding New Equity Features
All equity features should use routes starting with `/equity/`:
```tsx
<Route path="/equity/new-feature" element={<NewFeature />} />
```

#### Building F&O Module
When building F&O, follow this structure:
```
src/
├── pages/
│   ├── fo/                    # F&O specific pages
│   │   ├── FODashboard.tsx   # Already created
│   │   ├── FOContracts.tsx   # To be created
│   │   ├── FOPositions.tsx   # To be created
│   │   └── FOBills.tsx       # To be created
```

#### Detecting Current Module
```tsx
import { useModule } from '@/contexts/ModuleContext';

function MyComponent() {
  const { currentModule, setCurrentModule } = useModule();
  
  // currentModule will be 'equity', 'fo', or null
  if (currentModule === 'equity') {
    // Show equity-specific content
  }
}
```

#### Checking Route
```tsx
import { useLocation } from 'react-router-dom';

function MyComponent() {
  const location = useLocation();
  
  const isEquity = location.pathname.startsWith('/equity');
  const isFO = location.pathname.startsWith('/fo');
}
```

## Next Steps for F&O Module

### Phase 1: Database Design
Create F&O specific tables:
```sql
-- F&O specific tables
CREATE TABLE fo_contracts (
  id SERIAL PRIMARY KEY,
  contract_type VARCHAR(10), -- 'FUT', 'CALL', 'PUT'
  symbol VARCHAR(50),
  expiry_date DATE,
  strike_price DECIMAL(10,2), -- for options
  lot_size INTEGER,
  ...
);

CREATE TABLE fo_positions (
  id SERIAL PRIMARY KEY,
  party_id INTEGER REFERENCES party_master(id),
  contract_id INTEGER REFERENCES fo_contracts(id),
  quantity INTEGER,
  entry_price DECIMAL(10,2),
  current_mtm DECIMAL(10,2),
  ...
);
```

### Phase 2: F&O Features
1. **Contract Master**: Manage F&O instruments
2. **Position Tracking**: Track open positions
3. **MTM Calculator**: Daily mark-to-market
4. **Expiry Management**: Handle contract expiries
5. **F&O Bills**: Generate F&O specific bills

### Phase 3: Integration
- Shared party/broker masters
- Consolidated reports across EQ and F&O
- Combined ledger view

## Key Differences: Equity vs F&O

| Feature | Equity | F&O |
|---------|--------|-----|
| **Products** | Actual stocks | Futures, Call/Put Options |
| **Quantity** | Any amount | Fixed lot sizes |
| **Expiry** | No expiry | Monthly expiry dates |
| **Payment** | Full amount | Only margin |
| **Settlement** | T+2 days | Daily MTM + Expiry |
| **Contract Types** | Buy/Sell | Long/Short Futures, Buy/Sell Options |
| **Strike Price** | N/A | Options have strike prices |

## Benefits of Module System

1. **Separation of Concerns**: EQ and F&O logic are isolated
2. **Scalability**: Easy to add more modules (Commodities, Currency, etc.)
3. **User Experience**: Clear distinction between different trading types
4. **Maintenance**: Changes to one module don't affect the other
5. **Gradual Development**: Build F&O without disrupting equity

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution**: Make sure all new files are created and imports are correct

### Issue: Sidebar links not working
**Solution**: Check that links use `/equity/` prefix in `AppSidebar.tsx`

### Issue: Redirected to wrong page after login
**Solution**: Verify App.tsx routes, default route should go to `/modules`

### Issue: Module badge not showing
**Solution**: Check that ModuleProvider wraps the app in App.tsx

## Testing Checklist

- [ ] Login works and shows module selection
- [ ] Clicking Equity card opens equity module
- [ ] Clicking F&O card shows "Coming Soon" page
- [ ] Sidebar shows "Equity Module" badge
- [ ] Module switcher (⇄) button takes you back to selection
- [ ] All equity pages work (dashboard, trading, bills, etc.)
- [ ] Bill items show stock names (not "Contract 001")
- [ ] Legacy routes redirect correctly

## Future Enhancements

1. **Module Permissions**: Different users see different modules
2. **Module Analytics**: Track usage per module
3. **Module Themes**: Different color schemes per module
4. **Cross-Module Reports**: Combined reports across EQ and F&O
5. **Module Switcher in Dashboard**: Quick switch without going to selection screen
