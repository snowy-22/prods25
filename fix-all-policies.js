#!/usr/bin/env node

const fs = require('fs');

const files = [
  'supabase/migrations/20260107000003_trash_scenes_presentations.sql',
  'supabase/migrations/20260107000004_widget_cloud_sync.sql'
];

const regex = /CREATE POLICY "([^"]+)"\s*\n\s*ON\s+(\w+)\s+FOR\s+(\w+)/g;

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(regex, (match, policyName, tableName, direction) => {
    return `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};
CREATE POLICY "${policyName}"
  ON ${tableName} FOR ${direction}`;
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Updated: ${filePath}`);
});
