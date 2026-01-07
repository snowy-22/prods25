/**
 * Vercel AI Gateway Test Script
 * Tests the unified AI Gateway with multiple providers
 */

import { streamText } from 'ai';
import { getGatewayModel, selectBestModel } from '@/lib/ai-gateway';
import 'dotenv/config';

async function testGateway() {
  console.log('🚀 Testing Vercel AI Gateway...\n');

  // Test 1: Auto-select best model for speed
  console.log('📝 Test 1: Fast response (auto-selected model)');
  const fastModel = selectBestModel({ priority: 'speed' });
  console.log(`Selected model: ${fastModel}\n`);

  const result1 = streamText({
    model: getGatewayModel(fastModel),
    prompt: 'Kısaca TV25 projesi için yaratıcı bir slogan öner.',
  });

  process.stdout.write('Response: ');
  for await (const textPart of result1.textStream) {
    process.stdout.write(textPart);
  }
  console.log('\n');
  console.log('✅ Token usage:', await result1.usage);
  console.log('✅ Finish reason:', await result1.finishReason);
  console.log('\n---\n');

  // Test 2: Quality-focused response
  console.log('📝 Test 2: High-quality response (Claude)');
  const result2 = streamText({
    model: getGatewayModel('claude-3-sonnet'),
    prompt: 'Describe the future of AI in 3 sentences.',
  });

  process.stdout.write('Response: ');
  for await (const textPart of result2.textStream) {
    process.stdout.write(textPart);
  }
  console.log('\n');
  console.log('✅ Token usage:', await result2.usage);
  console.log('✅ Finish reason:', await result2.finishReason);
  console.log('\n---\n');

  // Test 3: Cost-effective response
  console.log('📝 Test 3: Cost-effective response (GPT-3.5)');
  const result3 = streamText({
    model: getGatewayModel('gpt-3.5-turbo'),
    prompt: 'What is the capital of Turkey?',
  });

  process.stdout.write('Response: ');
  for await (const textPart of result3.textStream) {
    process.stdout.write(textPart);
  }
  console.log('\n');
  console.log('✅ Token usage:', await result3.usage);
  console.log('✅ Finish reason:', await result3.finishReason);

  console.log('\n🎉 All tests completed successfully!');
}

testGateway().catch(console.error);
