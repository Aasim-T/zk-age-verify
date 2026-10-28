pragma circom 2.1.6;

// Canonical include path: circomlib/circuits/...
// Tell circom where to find it with: -l node_modules
// LessEqThan(n): proves in[0] <= in[1] for n-bit integers (max value 2^n - 1)
// n=12 supports 0..4095, which covers all years 1900..3000
include "circomlib/circuits/comparators.circom";

/*
 * AgeProof Circuit
 *
 * DISCLAIMER: Fictional learning demo only.
 * Does NOT authenticate any real document or government credential.
 * Proves only: birthYear + 18 <= currentYear  (year-level granularity).
 *
 * Private signal (never revealed to verifier):
 *   birthYear  — the prover's birth year
 *
 * Public signal (visible to verifier):
 *   currentYear — the reference year
 *
 * Public output (visible to verifier):
 *   eligible — 1 if age constraint holds; proof fails if 0
 */
template AgeProof() {

    // ── Signals ────────────────────────────────────────────────────────────
    signal input birthYear;    // PRIVATE: only the prover knows this
    signal input currentYear;  // PUBLIC:  the verifier can see this
    signal output eligible;    // PUBLIC:  1 if birthYear + 18 <= currentYear

    // ── Intermediate signal ────────────────────────────────────────────────
    signal birthYearPlus18;
    birthYearPlus18 <== birthYear + 18;

    // ── Bound checks (prevent underflow / overflow attacks) ────────────────
    // All years 1900–3000 fit in 12 bits (2^12 - 1 = 4095)

    // birthYear >= 1900
    component birthLow = LessEqThan(12);
    birthLow.in[0] <== 1900;
    birthLow.in[1] <== birthYear;
    birthLow.out === 1;

    // birthYear <= 3000
    component birthHigh = LessEqThan(12);
    birthHigh.in[0] <== birthYear;
    birthHigh.in[1] <== 3000;
    birthHigh.out === 1;

    // currentYear >= 1900
    component curLow = LessEqThan(12);
    curLow.in[0] <== 1900;
    curLow.in[1] <== currentYear;
    curLow.out === 1;

    // currentYear <= 3000
    component curHigh = LessEqThan(12);
    curHigh.in[0] <== currentYear;
    curHigh.in[1] <== 3000;
    curHigh.out === 1;

    // ── Core age constraint ────────────────────────────────────────────────
    // Prove: birthYear + 18 <= currentYear
    // Hard constraint: if false, witness is unsatisfiable → no proof possible
    component ageCheck = LessEqThan(12);
    ageCheck.in[0] <== birthYearPlus18;
    ageCheck.in[1] <== currentYear;
    ageCheck.out === 1;   // <── HARD CONSTRAINT

    // ── Output ────────────────────────────────────────────────────────────
    eligible <== ageCheck.out;
}

// currentYear is public; birthYear is private by default
component main { public [currentYear] } = AgeProof();
