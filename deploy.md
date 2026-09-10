# Deploying BMTN Friday

## One-time setup (do this once)

**1. Install tools**
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Node.js 20+](https://nodejs.org/)

**2. Configure AWS credentials**

You'll receive an access key ID and secret. Run:
```bash
aws configure --profile bmtnfriday
```
Enter the key ID, secret, region `us-east-1`, and output format `json`.

Then export the profile before running any commands below:
```bash
export AWS_PROFILE=bmtnfriday
```

**3. Clone the repo**
```bash
git clone https://github.com/davydr2/bmtnfriday.git
cd bmtnfriday
```

---

## Deploying the backend

```bash
cd backend
sam build
sam deploy --stack-name bmtnfriday --region us-east-1 \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --no-confirm-changeset --resolve-s3 \
  --parameter-overrides "SlackWebhookUrl=https://hooks.slack.com/workflows/YOUR_URL_HERE"
```

Leave `SlackWebhookUrl` as-is if you don't have it yet — it can be updated any time by rerunning this command with the real URL.

---

## Deploying the frontend

```bash
cd ../frontend
npm install
VITE_API_URL=https://5dxx2v6wl8.execute-api.us-east-1.amazonaws.com/prod \
VITE_COGNITO_USER_POOL_ID=us-east-1_4w5JjWPx8 \
VITE_COGNITO_CLIENT_ID=1chnau49v54vash92p2fsooi49 \
VITE_COGNITO_DOMAIN=bmtnfriday-auth.auth.us-east-1.amazoncognito.com \
npm run build

aws s3 sync dist/ s3://bmtnfriday-web/ --delete
aws cloudfront create-invalidation --distribution-id E2GGMKMBQ7V9TW --paths "/*"
```

---

## Adding employees

Employees must be created by an admin — they cannot self-register.

```bash
# Create user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_4w5JjWPx8 \
  --username employee@vso.com \
  --user-attributes Name=email,Value=employee@vso.com \
  --temporary-password Welcome2025!

# Make someone an admin
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_4w5JjWPx8 \
  --username employee@vso.com \
  --group-name admin
```

---

## Wiring up the Slack nag

1. In Slack, create a **Workflow** with a webhook trigger
2. Add a step to post a message to your nag channel (the webhook payload will include the text)
3. Copy the webhook URL and redeploy the backend with it:

```bash
cd backend
sam build
sam deploy --stack-name bmtnfriday --region us-east-1 \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --no-confirm-changeset --resolve-s3 \
  --parameter-overrides "SlackWebhookUrl=https://hooks.slack.com/workflows/REAL_URL"
```
