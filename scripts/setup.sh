#!/usr/bin/env bash
set -e

KEYS=keys
PTAU="$KEYS/pot12_final.ptau"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ZK Trusted Setup — Groth16 (Learning Demo)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "▶ Checking required files..."
if [ ! -f "$PTAU" ]; then
  echo "  ❌ Missing: $PTAU"
  echo "  Run: wget -O keys/pot12_final.ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau"
  exit 1
fi
if [ ! -f "$KEYS/ageProof.r1cs" ]; then
  echo "  ❌ Missing: $KEYS/ageProof.r1cs"
  echo "  Run: circom circuits/ageProof.circom -l node_modules --r1cs --wasm --sym -o keys/"
  exit 1
fi
echo " All required files present"

echo ""
echo "▶ Phase 2a: Initialize circuit-specific zkey"
snarkjs groth16 setup \
  "$KEYS/ageProof.r1cs" \
  "$PTAU" \
  "$KEYS/ageProof_0000.zkey"
echo "ageProof_0000.zkey created"

echo ""
echo "▶ Phase 2b: Contribute randomness (local — learning only)"
snarkjs zkey contribute \
  "$KEYS/ageProof_0000.zkey" \
  "$KEYS/ageProof_0001.zkey" \
  --name="Local Learning Contribution" \
  -v \
  -e="$(head -c 64 /dev/urandom | base64)"
echo " ageProof_0001.zkey created"

echo ""
echo "▶ Phase 2c: Apply random beacon"
snarkjs zkey beacon \
  "$KEYS/ageProof_0001.zkey" \
  "$KEYS/ageProof_final.zkey" \
  "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20" \
  10 \
  --name="Final Beacon"
echo " ageProof_final.zkey created"

echo ""
echo "▶ Verify the final zkey"
snarkjs zkey verify \
  "$KEYS/ageProof.r1cs" \
  "$PTAU" \
  "$KEYS/ageProof_final.zkey"
echo " Final zkey verified"

echo ""
echo "▶ Export verification key"
snarkjs zkey export verificationkey \
  "$KEYS/ageProof_final.zkey" \
  "$KEYS/verification_key.json"
echo "  keys/verification_key.json written"

echo ""
echo "▶ Generate Solidity verifier"
snarkjs zkey export solidityverifier \
  "$KEYS/ageProof_final.zkey" \
  contracts/Groth16Verifier.sol
echo "   contracts/Groth16Verifier.sol written"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Setup complete. Next: npx hardhat compile"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
