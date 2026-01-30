
const targetDateStr = "2026-01-15"; // Simulating user picking a date
const targetDate = new Date(targetDateStr);
console.log('Original Target Date (from string):', targetDate.toString());

const baseDate = new Date(targetDate);
console.log('Base Date (cloned):', baseDate.toString());

baseDate.setHours(0, 0, 0, 0);
console.log('Base Date (setHours 0):', baseDate.toString());

const nextDate = new Date(baseDate);
nextDate.setDate(baseDate.getDate() + 1);

console.log('Query Range Start (ISO):', baseDate.toISOString());
console.log('Query Range End (ISO):', nextDate.toISOString());

// Simulating "Today" behavior
const today = new Date();
console.log('\nToday Original:', today.toString());
today.setHours(0, 0, 0, 0);
console.log('Today Midnight:', today.toString());
console.log('Today Start (ISO):', today.toISOString());
