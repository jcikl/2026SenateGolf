# Golf Drive Grouping Implementation Tasks

## Data Structure & Types
- [x] Create GolfGrouping interface in types.ts
- [x] Add Firestore collection for golf groupings
- [x] Add state management in App.tsx
- [x] Add `golfDay1` and `golfDay2` fields to Guest interface

## Info Hub UI
- [ ] Add "Day 1 Golf" and "Day 2 Golf" tabs to Primary Navigation
- [ ] Create display component for golf groupings (GeneralInfo)
- [ ] Show flight numbers, tee times, and player lists (GeneralInfo)

## Admin Portal UI
- [x] Add "Golf Groupings" tab to Admin Portal
- [x] Create Day 1 and Day 2 management sections (Initial implementation)
- [x] Refactor Golf Tab to "Golfers Registry" List View
- [x] Implement Batch Flight Assignment
- [x] Implement Batch Clear Assignment
- [x] Implement Inline/Direct Editing of Flight Details
- [x] Add forms to create/edit golf flights (Replaced by Batch Edit)
- [x] Add player assignment interface (Replaced by Batch Edit)
- [x] Add Golf Statistics Dashboard

## Data Integration
- [x] Add Firestore listeners for golf groupings
- [x] Implement CRUD handlers (`handleUpdateGolfGroupings`)
- [x] Sync with guest data (`isGolfParticipant` field)
- [x] Implement `Guest -> GolfGrouping` reverse sync or direct update
