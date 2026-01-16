#!/usr/bin/env node

const fs = require('fs');

const filePath = 'supabase/migrations/20260107000002_sharing_and_realtime_sync.sql';
let content = fs.readFileSync(filePath, 'utf8');

// Replace CREATE POLICY with DROP + CREATE pattern
// This regex matches: CREATE POLICY "Policy Name"
//                   ON table_name FOR direction
const regex = /CREATE POLICY "([^"]+)"\s*\n\s*ON\s+(\w+)\s+FOR\s+(\w+)/g;

content = content.replace(regex, (match, policyName, tableName, direction) => {
  return `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};
CREATE POLICY "${policyName}"
  ON ${tableName} FOR ${direction}`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Migration file updated with DROP POLICY statements');
