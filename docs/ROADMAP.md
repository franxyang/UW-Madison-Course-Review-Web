# MadSpace Roadmap

**Last Updated**: 2026-02-09

This document tracks planned work after the current data-integrity and auth-stabilization milestone.

## Near-Term Priorities (P0/P1)

1. **Department Canonicalization**
   - Merge split aliases such as `ME` vs `M E` and `ECE` vs `E C E`
   - Enforce one canonical department identity per school context
   - Backfill cross-list and browse surfaces to read through canonical mappings

2. **School Ownership Corrections**
   - Correct known ownership mismatches (for example `ILS` under `Letters & Science`)
   - Add validation scripts to block future school/department drift during imports

3. **Cross-listed Write Canonical Target**
   - Route review writes to a canonical course target inside each cross-list group
   - Keep reads fully merged across the cross-list group for compatibility

4. **Auth Hardening**
   - Add resend cooldown + rate-limit observability dashboards for OTP routes
   - Add account lock and alerting rules for repeated failed credential attempts

## Mid-Term Priorities (P2)

1. **Admin Data Tooling**
   - Controlled data repair console for instructor/course alias reconciliation
   - Diff preview before applying canonical merges

2. **Course Intelligence**
   - Structured review summarization
   - Better recommendation ranking based on review quality + grade signals

3. **Operational Quality**
   - Expand telemetry coverage with route-level performance and API latency budgets
   - Add periodic integrity audits for GPA/review/instructor consistency

## Success Criteria

- No duplicate logical departments in browse and course detail surfaces
- Cross-listed courses show identical review/instructor/GPA visibility regardless of entry code
- OTP and credentials flows have clear observability and actionable alert thresholds
- Data repair workflows are auditable and reversible
