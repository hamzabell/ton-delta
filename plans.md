# Project Handover Plan (plans.md)

This document serves as a guide for any LLM picking up the implementation of the Pamelo.finance backend integration.

## Current Status

- **Phase**: Phase 3 (Watchman Engine)
- **Goal**: Integrate API calls with useSWR while maintaining the existing UI.
- **Rules**:
  - "Tests MUST be approved by the user before implementation."
  - "Ensure app builds and tests pass after each phase."
  - "Commit changes after each phase."

## Implementation Roadmap

### Phase 1: Foundation & Setup [COMPLETED]

- [x] Update `.env.example`
- [x] Install dependencies (`swr`, `axios`, `date-fns`)
- [x] Install & Setup Testing (`vitest`, `playwright`)
- [x] Verify build & tests

### Phase 2: API Layer Development [COMPLETED]

- [x] Define Types (`src/types/protocol.ts`)
- [x] Implement API Routes (`pairs`, `market`, `positions`)
- [x] Verify: Run tests and build (All passed)
- [x] Commit.

### Phase 3: Watchman Engine [IN PROGRESS]

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
