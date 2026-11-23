import { eq } from 'drizzle-orm';
import { getDb, schema } from '../../infra/database/client.js';
import { CreateAutomationInput } from '../../shared/schemas/automation.schema.js';
import { AppError } from '../../shared/errors/app-error.js';

export class AutomationService {
  static async listByOrg(organizationId: string) {
    const db = getDb();
    return db.query.automations.findMany({
      where: eq(schema.automations.organizationId, organizationId),
    });
  }

  static async create(organizationId: string, input: CreateAutomationInput) {
    const db = getDb();

    // Check plan limits (e.g., max active automations)
    const existing = await db.query.automations.findMany({
      where: eq(schema.automations.organizationId, organizationId),
    });

    if (existing.length >= 20) {
      throw new AppError('Plan limit reached. Upgrade to create more automations.', 403, 'LIMIT_EXCEEDED');
    }

    const [created] = await db
      .insert(schema.automations)
      .values({
        organizationId,
        instagramAccountId: input.instagramAccountId,
        name: input.name,
        status: 'ACTIVE',
        trigger: input.trigger,
        action: input.action,
      })
      .returning();

    return created;
  }

  static async delete(organizationId: string, automationId: string) {
    const db = getDb();
    const [deleted] = await db
      .delete(schema.automations)
      .where(eq(schema.automations.id, automationId))
      .returning();

    return deleted;
  }
}
