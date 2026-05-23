import { supabase } from '@/utils/supabase'

export type RetentionPeriod = 1 | 24 | 720 | 2160 | null // 1 hour, 1 day, 30 days (720h), 90 days (2160h), null = never delete

export interface ChatRetentionSettings {
  chatId: string
  retentionHours: RetentionPeriod
}

export interface RetentionOption {
  label: string
  hours: RetentionPeriod
}

class MessageRetentionService {
  readonly retentionOptions: RetentionOption[] = [
    { label: '1 час', hours: 1 },
    { label: '1 день', hours: 24 },
    { label: '1 месяц', hours: 720 },
    { label: '3 месяца', hours: 2160 },
    { label: 'Никогда не удалять', hours: null },
  ]

  /**
   * Set message retention policy for a chat
   * @param chatId - The chat ID
   * @param retentionHours - Number of hours to keep messages (1, 24, 720, 2160, or null for never delete)
   */
  async setRetentionPolicy(
    chatId: string,
    retentionHours: RetentionPeriod
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chats')
        .update({
          message_retention_hours: retentionHours,
        })
        .eq('id', chatId)

      if (error) {
        console.error('Error setting retention policy:', error)
        return false
      }

      console.log(`Set retention policy for chat ${chatId}: ${retentionHours} hours`)
      return true
    } catch (err) {
      console.error('Error in setRetentionPolicy:', err)
      return false
    }
  }

  /**
   * Get retention settings for a chat
   */
  async getRetentionPolicy(chatId: string): Promise<RetentionPeriod> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('message_retention_hours')
        .eq('id', chatId)
        .single()

      if (error) {
        console.error('Error fetching retention policy:', error)
        return 720 // Default to 30 days
      }

      return data?.message_retention_hours || 720
    } catch (err) {
      console.error('Error in getRetentionPolicy:', err)
      return 720
    }
  }

  /**
   * Manually trigger deletion of expired messages
   * Note: This is for manual cleanup. Supabase should handle this via cron job.
   */
  async deleteExpiredMessages(): Promise<boolean> {
    try {
      // This would need a database function to execute
      // For now, we rely on Supabase scheduled functions
      console.log('Expired message cleanup triggered (handled by Supabase cron)')
      return true
    } catch (err) {
      console.error('Error in deleteExpiredMessages:', err)
      return false
    }
  }

  /**
   * Calculate when messages will be deleted
   */
  calculateExpiryDate(createdAt: string, retentionHours: RetentionPeriod): Date | null {
    if (!retentionHours) return null

    const date = new Date(createdAt)
    date.setHours(date.getHours() + retentionHours)
    return date
  }

  /**
   * Check if a message would be expired
   */
  isMessageExpired(createdAt: string, retentionHours: RetentionPeriod): boolean {
    if (!retentionHours) return false

    const expiryDate = this.calculateExpiryDate(createdAt, retentionHours)
    if (!expiryDate) return false

    return new Date() > expiryDate
  }

  /**
   * Format retention period for display
   */
  formatRetentionPeriod(hours: RetentionPeriod): string {
    const option = this.retentionOptions.find(opt => opt.hours === hours)
    return option?.label || 'Никогда не удалять'
  }

  /**
   * Get label for retention hours
   */
  getRetentionLabel(hours: RetentionPeriod): string {
    return this.formatRetentionPeriod(hours)
  }
}

export const messageRetentionService = new MessageRetentionService()
