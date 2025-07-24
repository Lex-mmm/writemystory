#!/bin/bash

# Script to make phone_number optional in story_team_members table
# Run this from your project root directory

echo "🔄 Running database migration: Make phone_number optional..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo ""
    echo "🔧 Alternative: Run the SQL manually in your Supabase dashboard:"
    echo "   Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql"
    echo "   Copy and paste the contents of: database-migrations/make_phone_optional.sql"
    exit 1
fi

# Run the migration
echo "📝 Executing SQL migration..."
supabase db push --file database-migrations/make_phone_optional.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📋 Changes made:"
    echo "   • phone_number column is now optional (nullable)"
    echo "   • Added constraint: at least one of phone_number OR email must be provided"
    echo ""
    echo "🧪 You can now test adding team members with only email addresses!"
else
    echo "❌ Migration failed. Please check the error above."
    echo ""
    echo "🔧 Manual steps:"
    echo "1. Go to your Supabase dashboard SQL editor"
    echo "2. Run the SQL from: database-migrations/make_phone_optional.sql"
fi
