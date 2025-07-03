#!/bin/bash

echo "🚀 Setting up Genie Backend..."

# Create .env file
echo "📝 Creating .env file..."
cat > .env << 'EOL'
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/genie-food-tracker

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=genie-food-tracker-bucket
EOL

# Create config/database.js
echo "📦 Creating database config..."
cat > config/database.js << 'EOL'
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
EOL

echo "✅ Basic setup complete!"
echo "Now run: npm run dev"
