#!/usr/bin/env node
/**
 * Simple test runner for frontend tests
 */

const { exec } = require('child_process');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function runCommand(command, description) {
  return new Promise((resolve) => {
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bold}Running: ${description}${colors.reset}`);
    console.log(`Command: ${command}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);

    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`${colors.red}❌ ${description} - FAILED${colors.reset}`);
        console.error(`Error: ${error.message}`);
        if (stderr) console.error(`Stderr: ${stderr}`);
        resolve(false);
      } else {
        console.log(`${colors.green}✅ ${description} - PASSED${colors.reset}`);
        if (stdout) console.log(stdout);
        resolve(true);
      }
    });

    // Stream output in real-time
    process.stdout?.on('data', (data) => {
      process.stdout.write(data);
    });

    process.stderr?.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}

async function main() {
  console.log(`${colors.bold}🧪 WhatsApp Scheduler - Frontend Test Suite${colors.reset}`);
  console.log('==========================================');

  const testCommands = [
    { 
      command: 'npm test -- --watchAll=false --testMatch="**/MessageScheduler.test.tsx"', 
      description: 'MessageScheduler Component Tests' 
    },
    { 
      command: 'npm test -- --watchAll=false', 
      description: 'All Unit Tests' 
    },
    { 
      command: 'npm run test:coverage', 
      description: 'Tests with Coverage Report' 
    }
  ];

  console.log(`\n${colors.yellow}📋 Test Plan:${colors.reset}`);
  testCommands.forEach(({ description }) => {
    console.log(`  - ${description}`);
  });

  let allPassed = true;

  // Run each test suite
  for (const { command, description } of testCommands) {
    const passed = await runCommand(command, description);
    if (!passed) {
      allPassed = false;
      break; // Stop on first failure for faster feedback
    }
  }

  // Summary
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}📊 Test Summary${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);

  if (allPassed) {
    console.log(`${colors.green}✅ All tests passed successfully!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some tests failed. Please check the output above.${colors.reset}`);
    process.exit(1);
  }
}

// Run the test suite
main().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});