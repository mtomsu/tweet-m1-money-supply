# tweet-m1-money-supply

This project is built on the [serverless framework](https://www.serverless.com/framework/docs/providers/aws/guide) and creates the following AWS resources when deployed:

- SecretsManager secret
- Lambda function w/ CloudWatch metric and alarm
- SNS topic

## Prerequisites

- AWS CLI has been configured
- Twitter API credentials have been generated

## Install dependencies

```bash
yarn install
```

## Initial deployment

Create the deployment bucket (see `serverless.yml` for bucket name) for CloudFormation:

```bash
aws s3 mb s3://<bucket-name>
```

## Deploy resources

See `environment.yml` for stage-specific variables.

```bash
sls deploy -v -s <stage> --aws-profile <profile>
```

## Set Twitter credentials

After the initial deployment, update the newly created secret via the SecretsManager console. The secret must have the following key/value pairs with your Twitter API credentials:

```json
{
  "apiKey": "",
  "apiKeySecret": "",
  "accessToken": "",
  "accessTokenSecret": ""
}
```

## Remove resources

```bash
sls remove -v -s <stage> --aws-profile <profile>
```
