import { supabase } from '@/utils/supabase'

export type RetentionPeriod = 7 | 30 | 90 | null // null = never delete

export interface ChatRetentionSettings {
  chatId: string
  retentionDays: RetentionPeriod
}

class MessageRetentionService {
  /**
   * Set message retention policy for a chat
   * @param chatId - The chat ID
   * @param retentionDays - Number of days to keep messages (7, 30, 90, or null for never delete)
   */
  async setRetentionPolicy(
    chatId: string,
    retentionDays: RetentionPeriod
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chats')
        .update({
          message_retention_days: retentionDays,
        })
        .eq('id', chatId)

      if (error) {
        console.error('Error setting retention policy:', error)
        return false
      }

      console.log(`Set retention policy for chat ${chatId}: ${retentionDays} days`)
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
        .select('message_retention_days')
        .eq('id', chatId)
        .single()

      if (error) {
        console.error('Error fetching retention policy:', error)
        return 30 // Default to 30 days
      }

      return data?.message_retention_days || 30
    } catch (err) {
      console.error('Error in getRetentionPolicy:', err)
      return 30
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
  calculateExpiryDate(createdAt: string, retentionDays: RetentionPeriod): Date | null {
    if (!retentionDays) return null
    
    const date = new Date(createdAt)
    date.setDate(date.getDate() + retentionDays)
    return date
  }

  /**
   * Check if a message would be expired
   */
  isMessageExpired(createdAt: string, retentionDays: RetentionPeriod): boolean {
    if (!retentionDays) return false
    
    const expiryDate = this.calculateExpiryDate(createdAt, retentionDays)
    if (!expiryDate) return false
    
    return new Date() > expiryDate
  }

  /**
   * Format retention period for display
   */
  formatRetentionPeriod(days: RetentionPeriod): string {
    if (!days) return 'Никогда не удалять'
    if (days === 7) return '7 дней'
    if (days === 30) return '30 дней'
    if (days === 90) return '90 дней'
    return `${days} дней`
  }
}

export const messageRetentionService = new MessageRetentionService()
