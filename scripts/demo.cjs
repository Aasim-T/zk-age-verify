"use strict";

const fs   = require("fs");
const path = require("path");
const hre  = require("hardhat");

const ROOT        = path.resolve(__dirname, "..");
const INPUT_FILE  = path.resolve(ROOT, process.env.INPUT_FILE || "input/age-input.json");
const KEYS_DIR    = path.join(ROOT, "keys");
const WASM_FILE   = path.join(KEYS_DIR, "ageProof_js", "ageProof.wasm");
const ZKEY_FILE   = path.join(KEYS_DIR, "ageProof_final.zkey");
const VKEY_FILE   = path.join(KEYS_DIR, "verification_key.json");

function banner(text) {
  const line = "─".repeat(58);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${text.padEnd(56)}│`);
  console.log(`└${line}┘`);
}

function checkFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}:\n  ${filePath}`);
  }
}

async function main() {
  const { groth16 } = await import("snarkjs");

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     ZK Age Verification — Simulated Aadhaar-Style       ║");
  console.log("║     Circom 2 · Groth16 · Solidity · Hardhat Local       ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  DISCLAIMER: Fictional demo. No real credentials used.  ║");
  console.log("║  Year-level granularity only — not exact birthday math.  ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  checkFile(INPUT_FILE, "input file");
  checkFile(WASM_FILE,  "compiled circuit WASM — run: circom compile");
  checkFile(ZKEY_FILE,  "proving key — run: bash scripts/setup.sh");
  checkFile(VKEY_FILE,  "verification key — run: bash scripts/setup.sh");

  const input       = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  const birthYear   = parseInt(input.birthYear,   10);
  const currentYear = parseInt(input.currentYear, 10);
  const ageApprox   = currentYear - birthYear;
  const willPass    = ageApprox >= 18;

  banner("STEP 1 · Input Values");
  console.log(`  Input file   : ${path.relative(ROOT, INPUT_FILE)}`);
  console.log(`  birthYear    : ${birthYear}  ← PRIVATE (verifier never sees this)`);
  console.log(`  currentYear  : ${currentYear}  ← PUBLIC  (included in proof)`);
  console.log(`  Approx age   : ${ageApprox} years`);
  console.log(`  Maths check  : ${birthYear} + 18 = ${birthYear + 18} <= ${currentYear} → ${willPass ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  Expected     : ${willPass ? "Proof will be generated" : "Proof generation will FAIL (correct ZK behavior)"}`);

  banner("STEP 2 · Generate Groth16 Proof");
  console.log("  Computing witness and proof (birthYear never leaves your machine)…");

  let proof, publicSignals;
  try {
    ({ proof, publicSignals } = await groth16.fullProve(
      { birthYear: birthYear.toString(), currentYear: currentYear.toString() },
      WASM_FILE,
      ZKEY_FILE
    ));
  } catch (err) {
    console.error("\n  ❌  PROOF GENERATION FAILED");
    console.error("  ─────────────────────────────────────────────────────");
    console.error(`  Input  : birthYear=${birthYear}, currentYear=${currentYear}`);
    console.error(`  Reason : ${birthYear} + 18 = ${birthYear + 18} > ${currentYear}`);
    console.error("  The circuit constraint  ageCheck.out === 1  was violated.");
    console.error("  snarkjs cannot produce a valid proof for a false statement.");
    console.error("\n  ✅ This IS the correct, expected result for underage inputs.");
    console.error("  ZK guarantee: mathematically impossible to forge this proof.");
    process.exit(1);
  }

  console.log("  ✅ Proof generated");
  console.log("\n  Public signals (everything the verifier sees):");
  console.log(`    [0] eligible    = ${publicSignals[0]}  (1 = constraint satisfied)`);
  console.log(`    [1] currentYear = ${publicSignals[1]}`);
  console.log("  🔒 birthYear is NOT in publicSignals — zero-knowledge preserved");

  banner("STEP 3 · Off-chain Verification");
  const vKey       = JSON.parse(fs.readFileSync(VKEY_FILE, "utf8"));
  const offChainOk = await groth16.verify(vKey, publicSignals, proof);
  if (!offChainOk) { console.error("  ❌ Off-chain verify failed"); process.exit(1); }
  console.log("  ✅ Off-chain verification passed");

  banner("STEP 4 · Format Proof for Solidity");
  const rawCalldata = await groth16.exportSolidityCallData(proof, publicSignals);
  const [pA, pB, pC, pubSigs] = JSON.parse("[" + rawCalldata + "]");
  console.log(`  pA      : [${String(pA[0]).slice(0,14)}…]`);
  console.log(`  pB      : [[…],[…]]  (inner coords swapped for Solidity pairing)`);
  console.log(`  pC      : [${String(pC[0]).slice(0,14)}…]`);
  console.log(`  pubSigs : [${pubSigs}]`);

  banner("STEP 5 · Deploy Groth16Verifier.sol");
  const ethers          = hre.ethers;
  const [deployer]      = await ethers.getSigners();
  const balance         = await ethers.provider.getBalance(deployer.address);
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Balance  : ${ethers.formatEther(balance)} ETH (test funds)`);

  const VerifierFactory = await ethers.getContractFactory("Groth16Verifier");
  const verifier        = await VerifierFactory.deploy();
  await verifier.waitForDeployment();
  const contractAddress = await verifier.getAddress();
  console.log(`  ✅ Deployed at : ${contractAddress}`);

  banner("STEP 6 · On-chain Proof Verification");
  console.log("  Calling verifyProof() on the Solidity contract…\n");

  let onChainResult;
  try {
    onChainResult = await verifier.verifyProof(pA, pB, pC, pubSigs);
  } catch (err) {
    console.error("  ❌ verifyProof() reverted:", err.message);
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════════════════╗");
  if (onChainResult === true) {
    console.log("║                                                          ║");
    console.log("║   ✅  PROOF VALID                                        ║");
    console.log("║                                                          ║");
    console.log("║   Solidity verifier confirmed on-chain:                  ║");
    console.log(`║   • Born ≤ ${currentYear - 18} satisfies age ≥ 18 as of ${currentYear}         ║`);
    console.log("║   • Birth year was NEVER revealed to the verifier        ║");
    console.log("║   • Zero-knowledge property preserved ✓                  ║");
  } else {
    console.log("║   ❌  PROOF INVALID — verifier rejected the proof        ║");
  }
  console.log("╚══════════════════════════════════════════════════════════╝\n");
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err.message || err);
  process.exit(1);
});
