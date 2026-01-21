# Project Handover Plan (plans.md)

This document serves as a guide for any LLM picking up the implementation of the Pamelo.finance backend integration.

## Current Status

- **Phase**: Phase 1 (Foundation & Setup)
- **Goal**: Integrate API calls with useSWR while maintaining the existing UI.
- **Rules**:
  - "Tests MUST be approved by the user before implementation."
  - "Ensure app builds and tests pass after each phase."
  - "Commit changes after each phase."

## Implementation Roadmap

### Phase 1: Foundation & Setup

- [ ] Update `.env.example`
- [ ] Install dependencies (`swr`, `axios`, `date-fns`)
- [ ] Verify build

### Phase 2: API Layer Development

- [ ] Define Types (`src/types/protocol.ts`)
- [ ] **Review Step**: Create and submit API unit tests for user review.
- [ ] Implement API Routes:
  - `api/pairs`
  - `api/market`
  - `api/positions`
  - `api/execute`
- [ ] Verify: Run tests and build.
- [ ] Commit.

### Phase 3: Watchman Engine

- [ ] **Review Step**: Submit worker tests for review.
- [ ] Setup Redis/BullMQ.
- [ ] Implement Jobs (Drift, Funding, Safety).
- [ ] Verify: Run worker tests.
- [ ] Commit.

### Phase 4: Frontend Integration

- [ ] **Review Step**: Submit E2E tests (Playwright) for review.
- [ ] Implement `useSWR` hooks.
- [ ] Connect UI components to hooks.
- [ ] Verify: Run E2E tests.
- [ ] Commit.

## Technical Context

- **Stack**: Next.js 14+, Redis (BullMQ), Tailwind CSS, useSWR.
- **Architecture**:
  - **UI**: existing `src/app`.
  - **API**: `src/app/api` (to be built).
  - **Workers**: `src/workers`.
  - **State**: Redis (Queues + Cache), Database (Prisma).

## Next Steps for the LLM

1.  Check `task.md` (or this file) for the current active item.
2.  If in a "TESTS" step, write the test files and pause for `notify_user` approval.
3.  Once approved, implement the code to make tests pass.
4.  Run `npm run build` and `npm test` (or specific test command).
5.  Commit valid changes.
6.  Update this `plans.md` file with progress.
