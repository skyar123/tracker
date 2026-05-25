import { ScoringEngine } from './ScoringEngine.js';
import { TimeEngine } from './TimeEngine.js';

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. ASQ-3
  console.log('--- ASQ-3 Tests ---');
  let asq = ScoringEngine.scoreASQ3([10, 5, 10, 5, 0, null]);
  assert(asq.isValid && asq.score === 36, 'ASQ-3 Mean substitution works (sum 30 / 5 = 6, total 36)');
  asq = ScoringEngine.scoreASQ3([10, 5, null, null, 0, 5]);
  assert(asq.isValid === false, 'ASQ-3 invalidates >= 2 missing');

  // 2. BITSEA
  console.log('--- BITSEA Tests ---');
  let bitsea = ScoringEngine.scoreBITSEA([
    { type: 'problem', value: 2 },
    { type: 'problem', value: 'N' },
    { type: 'competence', value: 1 }
  ]);
  assert(bitsea.isValid && bitsea.problemScore === 2 && bitsea.competenceScore === 1, 'BITSEA strips N');

  // 3. Benchmarks
  console.log('--- Benchmarks ---');
  let needs = [
    { status: 'Met' }, // +1 for 3.1 & 3.2
    { status: 'Not Met', reason: 'Referral(s) made and family is still waiting' }, // +1 for 3.1 & 3.2
    { status: 'Not Met', reason: 'Caregiver did not access available service' }, // +1 for 3.2 only
    { status: 'Not Met', reason: 'Service not available in community' } // Excluded from denominator
  ];
  let bench = ScoringEngine.calculateBenchmarks(needs);
  assert(Math.round(bench.benchmark31) === 67, `Benchmark 3.1 is 66.6% (2/3) - Got ${bench.benchmark31}`);
  assert(Math.round(bench.benchmark32) === 100, `Benchmark 3.2 is 100% (3/3) - Got ${bench.benchmark32}`);

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
}

runTests();
