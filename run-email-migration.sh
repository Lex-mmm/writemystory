#!/bin/bash

# Database migration script for email responses
echo "🔄 Running database migration: Email responses table"

# Path to your Supabase database (adjust as needed)
DB_PATH="./backend/prisma/dev.db"

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database file not found at $DB_PATH"
    echo "Please adjust the DB_PATH in this script"
    exit 1
fi

# Apply the migration
sqlite3 "$DB_PATH" < database-migrations/add_email_responses.sql

if [ $? -eq 0 ]; then
    echo "✅ Email responses table migration completed successfully"
    echo ""
    echo "New table: story_question_responses"
    echo "- Stores email replies from team members"
    echo "- Links responses to questions and stories"
    echo "- Tracks response status (received, reviewed, integrated)"
    echo ""
    echo "Next steps:"
    echo "1. Configure Resend webhook URL"
    echo "2. Test email reply functionality"
    echo "3. View responses in project dashboard"
else
    echo "❌ Migration failed"
    exit 1
fi
