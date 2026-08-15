import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🔧 Environment Variables Verification\n');
console.log('=' .repeat(60));

// Required environment variables
const requiredVars = [
    {
        name: 'VITE_SUPABASE_URL',
        description: 'Supabase project URL',
        required: true
    },
    {
        name: 'VITE_SUPABASE_ANON_KEY',
        description: 'Supabase anonymous/public key',
        required: true
    },
    {
        name: 'VITE_SUPABASE_SERVICE_ROLE_KEY',
        description: 'Supabase service role key (for admin operations)',
        required: true
    },
    {
        name: 'VITE_GA_MEASUREMENT_ID',
        description: 'Google Analytics 4 Measurement ID',
        required: true,
        placeholder: 'G-XXXXXXXXXX'
    },
    {
        name: 'OPENAI_API_KEY',
        description: 'OpenAI API key for news summarization (Edge Functions)',
        required: true
    }
];

let allValid = true;

requiredVars.forEach(({ name, description, required, placeholder }) => {
    const value = process.env[name];
    const isValid = !!value && value !== placeholder && !value.includes('YOUR_') && !value.includes('sb_');

    console.log(`\n${name}:`);
    console.log(`  Description: ${description}`);
    console.log(`  Status: ${isValid ? '✅ Configured' : required ? '❌ Missing or invalid' : '⚠️  Optional'}`);

    if (!isValid && required) {
        allValid = false;
        console.log(`  Issue: ${value ? 'Using placeholder value' : 'Not configured'}`);
    } else if (isValid) {
        const maskedValue = name.includes('KEY') || name.includes('SECRET')
            ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
            : value.substring(0, 20) + (value.length > 20 ? '...' : '');
        console.log(`  Value: ${maskedValue}`);
    }
});

console.log('\n' + '='.repeat(60));

if (allValid) {
    console.log('\n✅ All required environment variables are properly configured!');
} else {
    console.log('\n❌ Some required environment variables are missing or invalid.');
    console.log('\n📝 To fix:');
    console.log('1. Open .env file in the project root');
    console.log('2. Replace placeholder values with actual values');
    console.log('3. Save the file and restart the development server');
    console.log('\n📚 Reference:');
    console.log('   - VITE_SUPABASE_URL: From Supabase Dashboard → Settings → API');
    console.log('   - VITE_SUPABASE_ANON_KEY: From Supabase Dashboard → Settings → API');
    console.log('   - VITE_SUPABASE_SERVICE_ROLE_KEY: From Supabase Dashboard → Settings → API (secret!)');
    console.log('   - VITE_GA_MEASUREMENT_ID: From Google Analytics 4 property');
    console.log('   - OPENAI_API_KEY: From OpenAI platform (platform.openai.com)');
}

console.log('\n' + '='.repeat(60));
