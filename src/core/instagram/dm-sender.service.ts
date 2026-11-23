import { eq, and } from 'drizzle-orm';
import { getDb, schema } from '../../infra/database/client.js';
import { sendDirectMessage } from '../../infra/instagram/graph-api.client.js';
import { logger } from '../../shared/utils/logger.js';

export class DmSenderService {
  static async processCommentEvent(message: any) {
    const { eventId, instagramAccountId, organizationId, commentData } = message;
    if (!instagramAccountId || !organizationId) return;

    const db = getDb();
    const commentText = (commentData.text || '').toLowerCase();
    const commenterId = commentData.from?.id;

    if (!commenterId) return;

    // 1. Fetch active automations for this account
    const activeAutomations = await db.query.automations.findMany({
      where: and(
        eq(schema.automations.instagramAccountId, instagramAccountId),
        eq(schema.automations.status, 'ACTIVE')
      ),
    });

    // 2. Fetch Instagram Account for access token
    const igAccount = await db.query.instagramAccounts.findFirst({
      where: eq(schema.instagramAccounts.id, instagramAccountId),
    });

    if (!igAccount) return;

    for (const auto of activeAutomations) {
      const trigger = auto.trigger as { keyword: string; matchType?: string };
      const keyword = (trigger.keyword || '').toLowerCase();

      const matched =
        trigger.matchType === 'EXACT'
          ? commentText.trim() === keyword.trim()
          : commentText.includes(keyword);

      if (!matched) continue;

      // Idempotency: Insert execution record
      const [execution] = await db
        .insert(schema.automationExecutions)
        .values({
          organizationId,
          automationId: auto.id,
          sourceEventId: eventId,
          status: 'PROCESSING',
          startedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();

      if (!execution) {
        logger.info('Automation already executed for this event', { autoId: auto.id, eventId });
        continue;
      }

      // 3. Send DM via Meta Graph API
      try {
        const action = auto.action as { message: string };
        await sendDirectMessage({
          recipientId: commenterId,
          message: action.message,
          accessToken: igAccount.encryptedAccessToken, // In production, decrypt token first
        });

        await db
          .update(schema.automationExecutions)
          .set({ status: 'SUCCESS', completedAt: new Date() })
          .where(eq(schema.automationExecutions.id, execution.id));

        logger.info('DM successfully sent', { executionId: execution.id, recipientId: commenterId });
      } catch (err: any) {
        logger.error('Failed to send DM', { error: err.message, executionId: execution.id });
        await db
          .update(schema.automationExecutions)
          .set({ status: 'FAILED', completedAt: new Date(), errorMessage: err.message })
          .where(eq(schema.automationExecutions.id, execution.id));
      }
    }
  }
}
