# serverless

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AWS Lambda Function - File Uploader</title>
</head>

<body>

    <h1>AWS Lambda Function - File Uploader</h1>

    <p>This AWS Lambda function is designed to handle file uploads to Google Cloud Storage triggered by AWS SNS messages. It includes error handling, DynamoDB logging, and email notifications via Mailgun.</p>

    <h2>Setup</h2>

    <ol>
        <li>
            <strong>Environment Variables:</strong>
            <p>Make sure to set up the necessary environment variables in the AWS Lambda environment for the following:</p>
            <ul>
                <li><code>REGION</code>: AWS region.</li>
                <li><code>MAIL_GUN_API_KEY</code>: API key for Mailgun.</li>
                <li><code>MAIL_GUN_DOMAIN</code>: Mailgun domain.</li>
                <li><code>AWS_DYNAMODB_TABLE</code>: DynamoDB table name.</li>
                <li><code>GCP_BUCKET</code>: Google Cloud Storage bucket name.</li>
                <li><code>GCP_SERVICE_ACCOUNT_KEY</code>: Base64-encoded Google Cloud service account key.</li>
            </ul>
        </li>
        <li>
            <strong>Dependencies:</strong>
            <p>Install the required Node.js dependencies by running:</p>
            <code>npm install</code>
        </li>
    </ol>

    <h2>Functionality</h2>

    <ul>
        <li>The Lambda function is triggered by AWS SNS messages.</li>
        <li>It fetches file data from the provided URL and uploads it to Google Cloud Storage.</li>
        <li>DynamoDB is used for logging the status of the file upload.</li>
        <li>Email notifications are sent via Mailgun based on the success or failure of the file upload.</li>
    </ul>

    <h2>Lambda Execution Role</h2>

    <p>Ensure that your Lambda function has the necessary permissions to:</p>
    <ul>
        <li>Read from AWS SNS.</li>
        <li>Write to Google Cloud Storage.</li>
        <li>Write to DynamoDB.</li>
        <li>Send emails via Mailgun.</li>
    </ul>
</body>

</html>
