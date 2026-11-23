import { createHmac } from 'crypto';
import { getDb, schema } from '../../infra/database/client.js';
import { enqueueWebhookEvent } from '../../infra/sqs/queue.client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/utils/logger.js';

export class WebhookService {
  static verifySignature(rawBody: string, signatureHeader?: string): boolean {
    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) return true; // Bypass in dev if not set

    if (!signatureHeader) return false;

    const expectedSignature = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    return expectedSignature === signatureHeader;
  }

  static async ingestWebhook(payload: any) {
    const db = getDb();

    // Iterate through entry/changes
    for (const entry of payload.entry || []) {
      const igUserId = entry.id;
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== 'comments') continue;

        const commentData = change.value;
        const providerEventId = commentData.id || `${igUserId}_${Date.now()}`;

        // Find owning Instagram Account
        const account = await db.query.instagramAccounts.findFirst({
          where: (fields, { eq }) => eq(fields.instagramUserId, igUserId),
        });

        const orgId = account?.organizationId || null;

        // Save to webhookEvents (idempotency layer 1)
        try {
          const [eventRecord] = await db
            .insert(schema.webhookEvents)
            .values({
              provider: 'instagram',
              providerEventId,
              organizationId: orgId,
              payload: commentData,
            })
            .onConflictDoNothing()
            .returning();

          if (!eventRecord) {
            logger.info('Duplicate webhook event received, dropping', { providerEventId });
            continue;
          }

          // Enqueue to SQS for asynchronous DM dispatch
          await enqueueWebhookEvent(
            {
              eventId: eventRecord.id,
              instagramAccountId: account?.id,
              organizationId: orgId,
              commentData,
            },
            providerEventId
          );

          logger.info('Webhook event ingested and enqueued', { eventId: eventRecord.id });
        } catch (err: any) {
          logger.error('Error ingesting webhook event', { error: err.message, providerEventId });
        }
      }
    }

    return { status: 'ok' };
  }
}
