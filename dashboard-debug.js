#!/usr/bin/env node

/**
 * Direct Dashboard Debug Test
 * Tests if email responses exist and why they're not showing
 */

const https = require('https');

const PRODUCTION_URL = 'https://write-my-story.com';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function debugDashboardIssue() {
  console.log('🔍 DASHBOARD EMAIL RESPONSES DEBUG');
  console.log('==================================\n');

  try {
    // Step 1: Create a test response with a known question ID format
    console.log('🧪 Step 1: Creating test email response with webhook...');
    
    // Use a realistic UUID that follows the pattern
    const testQuestionId = 'abcd1234-5678-90ab-cdef-123456789abc';
    
    const testEmail = {
      type: 'email.received',
      from: { email: 'debug@test.nl', name: 'Debug Test' },
      to: [{ email: 'info@write-my-story.com' }],
      subject: 'Re: Vraag voor je verhaal - WriteMyStory',
      text: `Hallo,

Dit is een test antwoord om te debuggen waarom email responses niet in het dashboard verschijnen.

Mijn antwoord: Dit is een debug test om te zien waar het probleem zit met email responses.

Met vriendelijke groet,
Debug Test

---
Original message:
> ID: ${testQuestionId} | Voor: Debug Test`,
      html: null,
      'message-id': '<debug-test-' + Date.now() + '@test.nl>'
    };
    
    console.log(`📧 Testing with question ID: ${testQuestionId}`);
    
    const webhookResponse = await makeRequest(`${PRODUCTION_URL}/api/email/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEmail)
    });
    
    console.log(`🎣 Webhook status: ${webhookResponse.status}`);
    console.log(`📝 Webhook response:`, webhookResponse.data);
    
    if (webhookResponse.status === 200) {
      const result = webhookResponse.data;
      console.log('\n✅ Webhook processed successfully!');
      console.log(`📧 Response ID: ${result.responseId}`);
      console.log(`❓ Extracted Question ID: ${result.questionId}`);
      console.log(`📚 Story ID: ${result.storyId}`);
      
      if (result.responseId) {
        // Step 2: Try to retrieve this specific response
        console.log('\n🔍 Step 2: Checking if response exists in database...');
        
        if (result.questionId) {
          const queryResponse = await makeRequest(`${PRODUCTION_URL}/api/questions/email-responses?questionId=${result.questionId}`, {
            method: 'GET'
          });
          
          console.log(`📊 Query by question ID status: ${queryResponse.status}`);
          
          if (queryResponse.status === 200) {
            const queryData = queryResponse.data;
            if (queryData.success && queryData.responses && queryData.responses.length > 0) {
              console.log(`✅ Found ${queryData.responses.length} response(s) for question ${result.questionId}`);
              
              const response = queryData.responses.find(r => r.id === result.responseId);
              if (response) {
                console.log('✅ Our test response is in the database!');
                console.log(`   Content: "${response.response_content.substring(0, 80)}..."`);
                console.log(`   Status: ${response.status}`);
                console.log(`   Question ID: ${response.question_id}`);
                console.log(`   Story ID: ${response.story_id}`);
                
                console.log('\n🎯 DIAGNOSIS: Response exists but question/story might not exist');
                console.log('   This is why it\'s not showing in dashboard');
                
              } else {
                console.log('⚠️  Response not found in query results');
              }
            } else {
              console.log('📭 No responses found for this question ID');
            }
          } else {
            console.log('❌ Failed to query responses:', queryData);
          }
        }
        
        // Step 3: Check for orphaned responses (responses without valid questions)
        console.log('\n🔍 Step 3: Checking for orphaned responses...');
        
        // Try to get responses by story ID = null (orphaned responses)
        const orphanedCheck = await makeRequest(`${PRODUCTION_URL}/api/questions/email-responses?storyId=00000000-0000-0000-0000-000000000000`, {
          method: 'GET'
        });
        
        console.log(`📊 Orphaned responses check: ${orphanedCheck.status}`);
        
        if (orphanedCheck.status === 200 && orphanedCheck.data.success) {
          console.log(`Found ${orphanedCheck.data.responses?.length || 0} responses with null/invalid story IDs`);
        }
      }
      
    } else if (webhookResponse.status === 500) {
      console.log('\n⚠️  Webhook error (probably foreign key constraint)');
      const error = webhookResponse.data;
      
      if (error.details && error.details.includes('foreign key constraint')) {
        console.log('✅ Question ID extraction is working correctly!');
        console.log('❌ But the question doesn\'t exist in your database');
        console.log('\n🎯 ROOT CAUSE IDENTIFIED:');
        console.log('   Your webhook is working, but you need to:');
        console.log('   1. Send questions via your dashboard (not test UUIDs)');
        console.log('   2. Reply to those actual emails');
        console.log('   3. The question ID in the email must match a real question');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
  
  console.log('\n📋 DEBUGGING CONCLUSIONS');
  console.log('========================');
  console.log('');
  console.log('🔧 TO FIX THE ISSUE:');
  console.log('');
  console.log('1. 📧 SEND A REAL EMAIL QUESTION:');
  console.log('   • Go to: https://write-my-story.com/dashboard');
  console.log('   • Open a project with questions');
  console.log('   • Click "📤 Doorsturen" on a question');
  console.log('   • Send it to your own email');
  console.log('');
  console.log('2. 📨 REPLY TO THAT EMAIL:');
  console.log('   • Open the email you received');
  console.log('   • Reply with a detailed answer');
  console.log('   • Send the reply');
  console.log('');
  console.log('3. ✅ CHECK YOUR DASHBOARD:');
  console.log('   • Go back to your project');
  console.log('   • Look for "📧 1 reactie" badge');
  console.log('   • The response should appear below the question');
  console.log('');
  console.log('🚨 KEY INSIGHT:');
  console.log('   Testing with random UUIDs won\'t work because');
  console.log('   the question must actually exist in your database!');
}

debugDashboardIssue().catch(console.error);
