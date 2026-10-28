🔐 Zero-Knowledge Age Verification Using Aadhaar-Style Data

A privacy-preserving age verification prototype built using Circom, Groth16, Solidity, and Hardhat.

This project demonstrates how a user can prove that they are at least 18 years old without revealing their actual birth year to the verifier.

Instead of sharing personal information, the user generates a Zero-Knowledge Proof (ZKP) that demonstrates eligibility. The proof is then verified off-chain and through a Solidity smart contract.

Disclaimer: This is an educational prototype that uses fictional, Aadhaar-style input data. It does not connect to UIDAI, verify genuine Aadhaar credentials, or use real identity documents.
📌 Table of Contents
Overview
Problem Statement
Our Solution
Key Features
Technology Stack
How It Works
Project Structure
Installation and Setup
Running the Demo
Expected Results
Zero-Knowledge Privacy
Limitations
Future Improvements
Contributing
License
🎯 Overview

Online platforms often require users to prove their age before accessing age-restricted services.

Traditional age verification methods may require users to disclose sensitive personal information, such as their date of birth or identity documents, even when the verifier only needs to know whether the user meets a minimum age requirement.

This project explores an alternative using Zero-Knowledge Proofs.

The user provides a private birth year and a public reference year. A Circom circuit checks whether the user is at least 18 years old and generates a Groth16 proof when the constraint is satisfied.

A verifier can then validate the proof without receiving the user's birth year.

Example

Suppose a user was born in 2000 and the reference year is 2026.

The user wants to prove:

"I am at least 18 years old."

The system checks the following condition:

birthYear + 18 <= currentYear

For the example:

2000 + 18 <= 2026

2018 <= 2026 ✅

The proof establishes eligibility without including the birth year in the public signals.

❗ Problem Statement

Many digital services need to verify whether a user meets a minimum age requirement.

However, conventional verification approaches can expose more personal information than necessary.

For example:

A website may need to know whether a user is at least 18.
The user may have to disclose their full date of birth or identity documents.
The verifier may receive sensitive information that is unnecessary for the eligibility decision.

The goal of this project is to demonstrate how cryptographic proofs can reduce unnecessary disclosure of personal information during age verification.

💡 Our Solution

This project implements an age verification circuit using Circom and the Groth16 proving system.

The system follows these steps:

The user provides a private birth year.
The current reference year is supplied as a public input.
The Circom circuit checks whether the user satisfies the minimum age requirement.
If the condition is satisfied, a Groth16 proof is generated.
The proof is verified off-chain.
A Solidity verifier smart contract verifies the proof on-chain.
The verifier receives an eligibility result without receiving the private birth year.

For underage inputs, the circuit constraint fails, preventing the generation of a valid proof for the required statement.

✨ Key Features
Privacy-preserving verification: The birth year is a private circuit input and is excluded from the public signals.
Zero-Knowledge Proofs: Uses the Groth16 proving system to demonstrate eligibility without disclosing the private input.
Circom circuit: Defines the mathematical constraints for age verification.
Off-chain verification: Checks the generated proof before submitting it to the smart contract.
On-chain verification: Uses a Solidity verifier contract to verify the proof.
Negative test case: Demonstrates that underage inputs violate the circuit constraint.
Local blockchain testing: Uses Hardhat to deploy and test the verifier in a local development environment.
🛠️ Technology Stack
Technology	Purpose
Circom 2	Defines the zero-knowledge circuit and its constraints
Groth16	Generates and verifies zero-knowledge proofs
snarkjs	Supports witness generation, proof generation, and proof verification
Solidity	Implements the on-chain proof verifier
Hardhat	Provides the local Ethereum development and testing environment
JavaScript / Node.js	Runs the demo and coordinates the verification workflow
JSON	Stores the demonstration inputs
⚙️ How It Works

The demo follows six main stages.

Step 1: Input Values

The system reads the input values from a JSON file.

Example:

json
{
  "birthYear": 2000,
  "currentYear": 2026
}

birthYear: Private input.
currentYear: Public input.

Note: This JSON represents fictional demonstration data, not an actual Aadhaar record.

Step 2: Generate the Zero-Knowledge Proof

The Circom circuit checks the age requirement.

The essential condition is:

text
birthYear + 18 <= currentYear


The circuit also enforces the requirement that its eligibility output must equal 1.

Conceptually, the constraint is:

circom
ageCheck.out === 1;


If the age requirement is satisfied, the witness can satisfy the circuit constraints and a proof can be generated.

If the requirement is not satisfied, witness generation fails because the circuit constraints cannot all be satisfied.

Step 3: Off-Chain Verification

The generated Groth16 proof is verified off-chain.

A successful verification confirms that the proof satisfies the verification key and corresponds to the public inputs supplied to the verifier.

Step 4: Format the Proof for Solidity

The proof is formatted into the representation expected by the Solidity verifier.

This includes:

pA: Proof coordinates.
pB: Proof coordinates formatted for the Solidity pairing verifier.
pC: Proof coordinates.
pubSigs: Public signals associated with the proof.

The public signals in this implementation are:

Index	Signal	Meaning
0	eligible	Eligibility output; 1 indicates that the circuit's age condition is satisfied
1	currentYear	Public reference year used in the age check

The birth year is not included in these public signals.

Step 5: Deploy the Solidity Verifier

The demo deploys Groth16Verifier.sol to the local Hardhat blockchain.

The deployment address is generated by the local blockchain environment and may change between runs.

Step 6: Verify the Proof On-Chain

The demo calls the Solidity verifier's verifyProof() function.

For a valid proof, the verifier confirms the statement represented by the proof and its public signals.

For the successful example, the output is:

text
PROOF VALID

Solidity verifier confirmed on-chain:
- The age requirement is satisfied.
- The birth year is not included in the public signals.
- Zero-knowledge verification succeeded.

📂 Project Structure

The following is an illustrative project structure based on the files used by the demo. Adjust it to match your actual repository.

text
zk-age-verify/
├── circuits/
│   └── ageProof.circom
├── input/
│   ├── age-input.json
│   └── age-input-invalid.json
├── scripts/
│   └── demo.cjs
├── contracts/
│   └── Groth16Verifier.sol
├── test/
├── hardhat.config.js
├── package.json
├── package-lock.json
└── README.md


Additional generated circuit artifacts, proving keys, verification keys, and witness files may exist depending on your setup.

🚀 Installation and Setup
Prerequisites

Make sure you have installed:

Node.js
npm
Circom 2
The dependencies specified by your project

You should also have the appropriate Groth16 setup artifacts and Solidity verifier available, as required by your implementation.

1. Clone the Repository
bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd zk-age-verify


Replace <YOUR_GITHUB_REPOSITORY_URL> with your actual repository URL.

2. Install Dependencies
bash
npm install

3. Prepare the Input

Check that input/age-input.json contains a valid age-verification example.

For example:

json
{
  "birthYear": 2000,
  "currentYear": 2026
}


Use fictional values only.

4. Run the Demo
bash
INPUT_FILE=input/age-input.json npx hardhat run scripts/demo.cjs --network hardhat


This runs the demonstration using Hardhat's local network.

Important: This command uses a local development blockchain. It does not deploy the contract to a public Ethereum network.

🧪 Running the Demo

The project includes two demonstration scenarios.

Test Case 1: Eligible User

Input:

json
{
  "birthYear": 2000,
  "currentYear": 2026
}


Run:

bash
INPUT_FILE=input/age-input.json npx hardhat run scripts/demo.cjs --network hardhat


Expected result:

text
Approx age   : 26 years
Maths check  : 2000 + 18 = 2018 <= 2026 → PASS

Proof generated

Off-chain verification passed

Deployed Groth16Verifier.sol

PROOF VALID


Result: The user satisfies the age requirement, the proof is generated, and the on-chain verification succeeds.

Test Case 2: Underage User

Input:

json
{
  "birthYear": 2010,
  "currentYear": 2026
}


Run:

bash
INPUT_FILE=input/age-input-invalid.json npx hardhat run scripts/demo.cjs --network hardhat


Expected result:

text
Approx age   : 16 years
Maths check  : 2010 + 18 = 2028 <= 2026 → FAIL

PROOF GENERATION FAILED

The circuit constraint ageCheck.out === 1 was violated.
snarkjs cannot produce a valid proof for a false statement.


Result: Witness generation fails because the underage input cannot satisfy the required circuit constraint.

The process exits with a non-zero status, indicating failure.

This is the expected behavior for the invalid test case.

Test Results Summary
Test Case	Birth Year	Reference Year	Age Requirement	Expected Outcome
Eligible user	2000	2026	Satisfied	Proof generation and verification succeed
Underage user	2010	2026	Not satisfied	Proof generation fails
🔒 Zero-Knowledge Privacy

The main objective of this project is to demonstrate that an eligibility decision can be verified without revealing the underlying birth year through the public proof inputs.

In this implementation:

birthYear is a private circuit input.
currentYear is a public input.
eligible is a public circuit output.
The proof is verified against the public signals.

The verifier receives the proof and its public inputs rather than the birth year itself.

What Does This Protect?

The birth year is not disclosed through the proof's public signals.

However, zero-knowledge does not automatically guarantee complete privacy for the entire application.

Privacy also depends on how inputs, witnesses, proof files, logs, and generated artifacts are handled.

For example, if the application prints the birth year to a shared terminal or stores the original input JSON in a publicly accessible location, that information can still be exposed.

The demo's console output displays the private input for educational purposes. In a real deployment, this should be removed or restricted.

⚠️ Limitations

This project is a proof-of-concept implementation and has several limitations.

1. Simulated Aadhaar-Style Input

The project does not read, authenticate, or validate real Aadhaar credentials.

The input is supplied directly as fictional data.

2. Year-Level Age Calculation

The circuit uses the year of birth rather than the complete date of birth.

For example, subtracting 2000 from 2026 gives 26, but this does not establish the exact age of someone born in 2000 without considering their birthday.

The current approach therefore provides a year-based eligibility approximation rather than exact birthday-aware age verification.

3. Input Authenticity

A zero-knowledge proof establishes that the circuit's constraints were satisfied for the supplied inputs. It does not independently establish that the private birth year belongs to the user or is authentic.

A production system would need a trustworthy method of obtaining and authenticating the birth year.

4. Trusted Setup

Groth16 requires appropriate trusted-setup procedures.

The security of a production deployment depends on using correctly generated circuit artifacts and handling the setup process securely.

5. Local Blockchain

The demo uses Hardhat's local development network.

Successful verification in this environment does not by itself demonstrate production readiness or public-network deployment.

🔮 Future Improvements

Potential improvements include:

Authentic credential integration: Explore a secure, authorized mechanism for obtaining age information from an authenticated identity credential.
Exact age calculation: Extend the circuit to account for the complete date of birth and reference date.
Improved privacy: Remove private inputs from console output and avoid retaining unnecessary sensitive data.
Frontend interface: Build a user-friendly interface for generating and verifying proofs.
Smart contract integration: Add a reusable age-verification interface for applications that need to check eligibility.
Automated testing: Add tests for valid proofs, invalid proofs, incorrect public signals, and malformed inputs.
Production security review: Audit the circuit, trusted setup, proof-generation workflow, and smart contract before deployment.
Credential-based verification: Investigate privacy-preserving proofs that can demonstrate properties of signed credentials without exposing the complete credential.
🤝 Contributing

Contributions and suggestions are welcome.

To contribute:

Fork the repository.
Create a feature branch.
Make your changes.
Run the relevant tests.
Submit a pull request describing your changes.

Please avoid including real identity documents or sensitive personal information in test data.

📜 License

Choose an appropriate open-source license for your project, such as the MIT License, and add the corresponding LICENSE file if you intend to distribute the project under that license.

Until a license is added, the repository should not be assumed to be available under the MIT License or another specific open-source license.

👨‍💻 Project Summary

This project demonstrates how zero-knowledge proofs can be used to verify an age-related eligibility claim without exposing the birth year in the public proof signals.

By combining Circom, Groth16, snarkjs, Solidity, and Hardhat, the prototype illustrates a privacy-preserving verification workflow with both successful and unsuccessful test cases.

The long-term goal is to explore how privacy-preserving cryptographic techniques can reduce unnecessary disclosure of personal information in digital identity verification.
