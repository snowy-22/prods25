#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const migrationDir = 'supabase/migrations';
const files = ['20260107000003_trash_scenes_presentations.sql', '20260107000004_widget_cloud_sync.sql'];

files.forEach(fileName => {
  const filePath = path.join(migrationDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace ALTER PUBLICATION statements with error-safe versions
  content = content.replace(
    /ALTER PUBLICATION supabase_realtime ADD TABLE\s+(\w+)\.(\w+);/g,
    `DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE $1.$2;
EXCEPTION WHEN DUPLICATE_OBJECT THEN
  NULL;
END;
$$;`
  );
  
  // Handle single-word table names (no schema prefix)
  content = content.replace(
    /ALTER PUBLICATION supabase_realtime ADD TABLE\s+(?![\w.]+\.)(\w+);/g,
    `DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE $1;
EXCEPTION WHEN DUPLICATE_OBJECT THEN
  NULL;
END;
$$;`
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed ALTER PUBLICATION in: ${fileName}`);
});

console.log('\n✨ All ALTER PUBLICATION statements wrapped!');
