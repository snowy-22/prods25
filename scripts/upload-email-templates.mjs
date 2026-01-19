#!/usr/bin/env node

/**
 * Supabase Email Templates Uploader
 * 
 * Usage:
 *   node scripts/upload-email-templates.mjs [TEMPLATE_TYPE]
 * 
 * Examples:
 *   node scripts/upload-email-templates.mjs welcome
 *   node scripts/upload-email-templates.mjs all
 * 
 * Environment Variables Required:
 *   - SUPABASE_URL: Project URL
 *   - SUPABASE_SERVICE_KEY: Service role key (for admin access)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Template mapping: file -> Supabase email type
const TEMPLATE_MAPPING = {
  'welcome': {
    file: '1-welcome.html',
    type: 'confirmation', // Closest match in Supabase
    label: 'Welcome Email',
    description: 'Sent when a new user signs up'
  },
  'password-reset': {
    file: '2-password-reset.html',
    type: 'recovery',
    label: 'Password Reset Email',
    description: 'Sent when user requests password reset'
  },
  'email-confirmation': {
    file: '3-email-confirmation.html',
    type: 'confirmation',
    label: 'Email Confirmation',
    description: 'Sent to confirm email address during signup'
  },
  'two-factor-auth': {
    file: '4-two-factor-auth.html',
    type: 'magic_link', // 2FA uses similar template
    label: 'Two-Factor Auth',
    description: 'Sent with 2FA OTP code'
  },
  'magic-link': {
    file: '5-magic-link.html',
    type: 'magic_link',
    label: 'Magic Link',
    description: 'Sent for passwordless login'
  },
  'account-suspended': {
    file: '6-account-suspended.html',
    type: 'confirmation', // Not a standard type, use confirmation
    label: 'Account Suspended',
    description: 'Sent when account is suspended'
  }
};

async function uploadTemplate(templateKey) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const templateConfig = TEMPLATE_MAPPING[templateKey];
  if (!templateConfig) {
    console.error(`❌ Unknown template: ${templateKey}`);
    console.error(`Available: ${Object.keys(TEMPLATE_MAPPING).join(', ')}`);
    process.exit(1);
  }

  const templatePath = path.join(PROJECT_ROOT, 'src', 'emails', 'templates', templateConfig.file);

  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template file not found: ${templatePath}`);
    process.exit(1);
  }

  try {
    console.log(`📧 Reading template: ${templateConfig.file}`);
    const htmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🔄 Uploading to Supabase...`);
    console.log(`   Type: ${templateConfig.type}`);
    console.log(`   Label: ${templateConfig.label}`);

    // Supabase Email Templates API
    // POST /rest/v1/auth/email_templates/{email_type}
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/set_email_template`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_type: templateConfig.type,
          subject: `[SUBJECT_NOT_SET] ${templateConfig.label}`,
          html: htmlContent,
          text: htmlContent // Fallback to HTML
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Upload failed: ${response.status}`);
      console.error(error);
      
      // Try alternative method: direct update
      console.log(`\n📝 Alternative: Manual update in Supabase Dashboard`);
      console.log(`   1. Go to: https://app.supabase.com/project/YOUR_PROJECT/auth/templates`);
      console.log(`   2. Select: ${templateConfig.type}`);
      console.log(`   3. Paste the HTML from: src/emails/templates/${templateConfig.file}`);
      return false;
    }

    const result = await response.json();
    console.log(`✅ ${templateConfig.label} uploaded successfully!`);
    return true;

  } catch (error) {
    console.error(`❌ Error uploading template:`, error.message);
    return false;
  }
}

async function uploadAllTemplates() {
  console.log(`\n📧 Supabase Email Templates Uploader\n`);
  
  const templates = Object.keys(TEMPLATE_MAPPING);
  let successful = 0;
  let failed = 0;

  for (const templateKey of templates) {
    try {
      const success = await uploadTemplate(templateKey);
      if (success) {
        successful++;
      } else {
        failed++;
      }
      console.log('');
    } catch (error) {
      console.error(`Error with ${templateKey}:`, error);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📁 Total: ${templates.length}`);

  if (failed === 0) {
    console.log(`\n🎉 All templates uploaded successfully!`);
  } else {
    console.log(`\n⚠️  Some templates failed. Check Supabase dashboard manually.`);
  }
}

// Main
const args = process.argv.slice(2);
const templateType = args[0]?.toLowerCase() || 'welcome';

if (templateType === 'all') {
  uploadAllTemplates().catch(console.error);
} else {
  (async () => {
    const success = await uploadTemplate(templateType);
    process.exit(success ? 0 : 1);
  })();
}