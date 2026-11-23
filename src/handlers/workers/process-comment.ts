import type { SQSEvent } from 'aws-lambda';
import { DmSenderService } from '../../core/instagram/dm-sender.service.js';
import { logger } from '../../shared/utils/logger.js';

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const messageBody = JSON.parse(record.body);
      await DmSenderService.processCommentEvent(messageBody);
    } catch (err: any) {
      logger.error('Failed to process SQS record', { error: err.message, messageId: record.messageId });
      // Rethrow to let SQS retry or move to DLQ after 5 attempts
      throw err;
    }
  }
};
