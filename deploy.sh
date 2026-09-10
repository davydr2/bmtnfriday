#!/usr/bin/env bash
set -e

STACK=bmtnfriday
REGION=us-east-1
BUCKET_NAME=bmtnfriday-web
DIST_ID=""   # fill in after first deploy

# --- Backend ---
echo "Building backend..."
cd backend
sam build

echo "Deploying backend..."
sam deploy \
  --stack-name $STACK \
  --region $REGION \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --parameter-overrides \
    CognitoUserPoolId=$VITE_COGNITO_USER_POOL_ID \
    CognitoClientId=$VITE_COGNITO_CLIENT_ID \
    SlackBotToken=${SLACK_BOT_TOKEN:-} \
    SlackChannelId=${SLACK_CHANNEL_ID:-}

# Capture outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

echo "API: $API_URL"
cd ..

# --- Frontend ---
echo "Building frontend..."
cd frontend
VITE_API_URL=$API_URL npm run build

echo "Uploading frontend..."
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

echo "Done."
