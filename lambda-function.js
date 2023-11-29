const { Storage } = require('@google-cloud/storage');
const { createWriteStream } = require('fs');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const dotenv = require('dotenv');
const AWS = require('aws-sdk');
const fetch = require('node-fetch')
dotenv.config();
exports.handler = async (event) => {
  const date = new Date()
  const timeStamp = date.toISOString();
  AWS.config.update({
      region: process.env.REGION,
    });

  const dynamoDBTable = new AWS.DynamoDB.DocumentClient();


  const SNSMessage = await JSON.parse(event.Records[0].Sns.Message);
  const email = SNSMessage.email;
  console.log("the whole message will be below")
  console.log(SNSMessage);
  const mailgun = new Mailgun(formData);
  const client = mailgun.client({ username: 'api', key: process.env.MAIL_GUN_API_KEY });
  const bucketName = process.env.GCP_BUCKET;


  const url = SNSMessage.submissionUrl.split('/');
  const fileName = url[url.length - 1];

  const storageFilePath = `${SNSMessage.assignmentId}/${SNSMessage.submissionId}/${fileName}`;
  const gcpServiceAccountKey = process.env.GCP_SERVICE_ACCOUNT_KEY;
  
  const decodedKey = JSON.parse(Buffer.from(gcpServiceAccountKey, 'base64').toString('utf-8'));
    try {



        const response = await fetch(SNSMessage.submissionUrl);
        console.log(response);
        if(response.ok) {
            const dynamoParams = {
                TableName: process.env.AWS_DYNAMODB_TABLE,
                Item: {
                    emailId: `${SNSMessage.email}/${timeStamp}`,
                    status: "Success",
                    timestamp: timeStamp,
                },
            };
    
            await dynamoDBTable.put(dynamoParams).promise();


            const googleCloudStorage = new Storage({
                projectId: decodedKey.project_id,
                credentials: {
                    type: decodedKey.type,
                    project_id: decodedKey.project_id,
                    private_key_id: decodedKey.private_key_id,
                    private_key: decodedKey.private_key,
                    client_email: decodedKey.client_email,
                    client_id: decodedKey.client_id,
                    auth_uri: decodedKey.auth_uri,
                    token_uri: decodedKey.token_uri,
                    auth_provider_x509_cert_url: decodedKey.auth_provider_x509_cert_url,
                    client_x509_cert_url: decodedKey.client_x509_cert_url,
                }
            });
            const file = await googleCloudStorage.bucket(bucketName).file(storageFilePath);
            const fileStream = file.createWriteStream();
            await pipeline(response.body, fileStream);
            console.log('File successfully uploaded to Google Cloud Storage.');    

/*             const fileConfig = {
              action: 'read',
              expires: Date.now + (15 * 60 * 1000),
            }
            
            file.getSignedUrl(fileConfig, (err, presigned) => {
              if (err) {
                console.error(err);
                return;
              }
            
              console.log(presigned);
            })
 */
            const messageData = {
                from: `no-reply@${process.env.MAIL_GUN_DOMOAIN}`,
                to: email,
                subject: `Submission Status for assignment ${SNSMessage.assignmentId}`,
                html: `
                <p>Your file has been uploaded successfully.</p>
                <p>Time of attempt: ${timeStamp}</p>
                <p>Number of attempts remaining: ${SNSMessage.reminingAttempts}</p>
                <p>File is stored on the below path: ${storageFilePath}</p>
                
              `, 
              };
              
              await client.messages.create(process.env.MAIL_GUN_DOMOAIN, messageData)
                .then((res) => {
                  console.log(res);
                })
                .catch((err) => {
                  console.error(err);
                });

                return;
        }
        else {
            const dynamoParams = {
                TableName: process.env.AWS_DYNAMODB_TABLE, 
                Item: {
                  emailId: `${SNSMessage.email}/${timeStamp}`,
                  status: "Failure",
                  timestamp: timeStamp,
              },
            };
            
            const messageData = {
                from: `no-reply@${process.env.MAIL_GUN_DOMOAIN}`,
                to: email,
                subject: `Submission Status for assignment ${SNSMessage.assignmentId}`,
                html: `
                <p>Your file has not been uploaded successfully.</p>
                <p>Time of attempt: ${timeStamp}</p>
                <p>Number of attempts remaining: ${SNSMessage.reminingAttempts}</p>
              `, 
              };
              
              await client.messages.create(process.env.MAIL_GUN_DOMOAIN, messageData)
                .then((res) => {
                  console.log(res);
                })
                .catch((err) => {
                  console.error(err);
                });

                await dynamoDBTable.put(dynamoParams).promise();

                return;
        }

        
    } catch (error) {
      const dynamoParams = {
        TableName: process.env.AWS_DYNAMODB_TABLE, 
        Item: {
          emailId: `${SNSMessage.email}/${timeStamp}`,
          status: "Failure",
          timestamp: timeStamp,
      },
    };
    const messageData = {
        from: `no-reply@${process.env.MAIL_GUN_DOMOAIN}`,
        to: email,
        subject: `Submission Status for assignment ${SNSMessage.assignmentId}`,
        html: `
        <p>Your file has not been uploaded successfully.</p>
        <p>Time of attempt: ${timeStamp}</p>
        <p>Number of attempts remaining: ${SNSMessage.reminingAttempts}</p>
      `, 
      };
      
      await client.messages.create(process.env.MAIL_GUN_DOMOAIN, messageData)
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.error(err);
        });

        await dynamoDBTable.put(dynamoParams).promise();
        
        return;
        /* 
        console.error('Error:', error);
        throw error; */
    }
};
