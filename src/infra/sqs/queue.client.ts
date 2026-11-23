import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({});

export async function enqueueWebhookEvent(payload: Record<string, unknown>, eventId: string) {
  const queueUrl = process.env.QUEUE_URL;
  if (!queueUrl) {
    throw new Error('QUEUE_URL environment variable is not defined');
  }

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(payload),
    MessageAttributes: {
      eventId: {
        DataType: 'String',
        StringValue: eventId,
      },
    },
  });

  return sqsClient.send(command);
}
