#!/usr/bin/env bash
# Usage: source .env.deploy && ./deploy.sh
# Required env vars: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID
# Optional: SLACK_BOT_TOKEN, SLACK_CHANNEL_ID
set -e

STACK=bmtnfriday
REGION=us-east-1

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
    SlackWebhookUrl="${SLACK_WEBHOOK_URL:-}"

# Capture stack outputs
get_output() {
  aws cloudformation describe-stacks \
    --stack-name $STACK \
    --region $REGION \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" \
    --output text
}

API_URL=$(get_output ApiUrl)
DIST_ID=$(get_output CloudFrontDistributionId)
BUCKET=$(get_output WebBucketName)
POOL_ID=$(get_output CognitoUserPoolId)
CLIENT_ID=$(get_output CognitoClientId)
COGNITO_DOMAIN=$(get_output CognitoDomain)

echo ""
echo "Stack outputs:"
echo "  API:     $API_URL"
echo "  Pool:    $POOL_ID"
echo "  Client:  $CLIENT_ID"
echo "  Auth:    https://$COGNITO_DOMAIN"
echo ""

cd ..

# --- Frontend ---
echo "Building frontend..."
cd frontend

VITE_API_URL=$API_URL \
VITE_COGNITO_USER_POOL_ID=$POOL_ID \
VITE_COGNITO_CLIENT_ID=$CLIENT_ID \
VITE_COGNITO_DOMAIN=$COGNITO_DOMAIN \
  npm run build

echo "Uploading frontend to S3..."
aws s3 sync dist/ s3://$BUCKET/ --delete --region $REGION

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

echo ""
echo "Deployed to: https://bmtnfriday.com"
echo "Done."
