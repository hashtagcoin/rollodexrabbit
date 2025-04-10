import { supabase } from './supabase';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { RewardsService, Badge, UserBadge } from './rewardsService';

// Types for notifications
export type NotificationType = 
  | 'badge_earned' 
  | 'points_earned' 
  | 'streak_milestone' 
  | 'booking_reminder' 
  | 'booking_confirmation'
  | 'group_invitation'
  | 'friend_request'
  | 'message'
  | 'system';

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
};

// Error handling for notification service
export class NotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationError';
  }
}

/**
 * Notification Service - Handles all notification functionality
 */
export class NotificationService {
  /**
   * Register for push notifications
   * @returns Push token
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if we're running on a physical device
      if (!Constants.isDevice) {
        throw new NotificationError('Must use physical device for push notifications');
      }

      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new NotificationError('Failed to get push token for push notification!');
      }
      
      // Get push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      
      // Configure notifications on Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      
      return token;
    } catch (err: unknown) {
      console.error('Error registering for push notifications:', err);
      return null;
    }
  }

  /**
   * Save push token to database
   * @param userId User ID
   * @param token Push token
   * @returns Success status
   */
  static async savePushToken(userId: string, token: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: userId,
          push_token: token,
          device_type: Platform.OS,
          updated_at: new Date().toISOString(),
        });

      if (error) throw new NotificationError(error.message);
      return true;
    } catch (err: unknown) {
      console.error('Error saving push token:', err);
      throw err instanceof NotificationError 
        ? err 
        : new NotificationError(err instanceof Error ? err.message : 'Failed to save push token');
    }
  }

  /**
   * Get notifications for a user
   * @param userId User ID
   * @param limit Number of notifications to retrieve
   * @param offset Offset for pagination
   * @returns Array of notifications
   */
  static async getNotifications(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw new NotificationError(error.message);
      return data || [];
    } catch (err: unknown) {
      console.error('Error getting notifications:', err);
      throw err instanceof NotificationError 
        ? err 
        : new NotificationError(err instanceof Error ? err.message : 'Failed to get notifications');
    }
  }

  /**
   * Mark a notification as read
   * @param notificationId Notification ID
   * @returns Success status
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw new NotificationError(error.message);
      return true;
    } catch (err: unknown) {
      console.error('Error marking notification as read:', err);
      throw err instanceof NotificationError 
        ? err 
        : new NotificationError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param userId User ID
   * @returns Success status
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw new NotificationError(error.message);
      return true;
    } catch (err: unknown) {
      console.error('Error marking all notifications as read:', err);
      throw err instanceof NotificationError 
        ? err 
        : new NotificationError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }

  /**
   * Create a notification
   * @param userId User ID
   * @param title Notification title
   * @param body Notification body
   * @param type Notification type
   * @param data Additional data
   * @returns Created notification
   */
  static async createNotification(
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    data: Record<string, any> = {}
  ): Promise<Notification | null> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          body,
          type,
          data,
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw new NotificationError(error.message);
      
      // Send push notification if possible
      try {
        await this.sendPushNotification(userId, title, body, data);
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
        // Continue even if push fails
      }
      
      return notification;
    } catch (err: unknown) {
      console.error('Error creating notification:', err);
      throw err instanceof NotificationError 
        ? err 
        : new NotificationError(err instanceof Error ? err.message : 'Failed to create notification');
    }
  }

  /**
   * Send a push notification to a user
   * @param userId User ID
   * @param title Notification title
   * @param body Notification body
   * @param data Additional data
   * @returns Success status
   */
  static async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      // Get user's push token
      const { data: tokenData, error } = await supabase
        .from('user_push_tokens')
        .select('push_token')
        .eq('user_id', userId)
        .single();

      if (error || !tokenData) return false;

      // Send push notification via Expo's push service
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: tokenData.push_token,
          title,
          body,
          data,
          sound: 'default',
        }),
      });

      return true;
    } catch (err: unknown) {
      console.error('Error sending push notification:', err);
      return false;
    }
  }

  /**
   * Create a badge earned notification
   * @param userId User ID
   * @param badge Badge that was earned
   * @returns Created notification
   */
  static async createBadgeEarnedNotification(
    userId: string,
    badge: Badge
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      'New Badge Earned!',
      `You've earned the "${badge.name}" badge. ${badge.description}`,
      'badge_earned',
      {
        badge_id: badge.id,
        badge_name: badge.name,
        badge_description: badge.description,
        badge_icon: badge.icon_url,
        points: badge.points,
      }
    );
  }

  /**
   * Create a points earned notification
   * @param userId User ID
   * @param points Points earned
   * @param reason Reason for earning points
   * @returns Created notification
   */
  static async createPointsEarnedNotification(
    userId: string,
    points: number,
    reason: string
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      'Points Earned!',
      `You've earned ${points} points for ${reason}.`,
      'points_earned',
      {
        points,
        reason,
      }
    );
  }

  /**
   * Create a streak milestone notification
   * @param userId User ID
   * @param streakType Type of streak
   * @param days Number of days in streak
   * @returns Created notification
   */
  static async createStreakMilestoneNotification(
    userId: string,
    streakType: string,
    days: number
  ): Promise<Notification | null> {
    const streakName = streakType.charAt(0).toUpperCase() + streakType.slice(1);
    
    return this.createNotification(
      userId,
      `${days}-Day ${streakName} Streak!`,
      `Congratulations! You've maintained your ${streakName.toLowerCase()} streak for ${days} days.`,
      'streak_milestone',
      {
        streak_type: streakType,
        days,
      }
    );
  }

  /**
   * Create a booking reminder notification
   * @param userId User ID
   * @param bookingId Booking ID
   * @param serviceTitle Service title
   * @param scheduledAt Scheduled date/time
   * @returns Created notification
   */
  static async createBookingReminderNotification(
    userId: string,
    bookingId: string,
    serviceTitle: string,
    scheduledAt: string
  ): Promise<Notification | null> {
    const date = new Date(scheduledAt);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return this.createNotification(
      userId,
      'Upcoming Booking Reminder',
      `You have a booking for "${serviceTitle}" on ${formattedDate} at ${formattedTime}.`,
      'booking_reminder',
      {
        booking_id: bookingId,
        service_title: serviceTitle,
        scheduled_at: scheduledAt,
      }
    );
  }

  /**
   * Process new badges and create notifications
   * @param userId User ID
   * @returns Number of notifications created
   */
  static async processNewBadges(userId: string): Promise<number> {
    try {
      // Get user badges that haven't been notified yet
      const { data: badgeData, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          badge_id,
          is_notified,
          badge:badge_definitions(*)
        `)
        .eq('user_id', userId)
        .eq('is_notified', false);

      if (error) throw new NotificationError(error.message);
      if (!badgeData || badgeData.length === 0) return 0;

      let notificationCount = 0;

      // Create notifications for each new badge
      for (const userBadge of badgeData) {
        if (userBadge.badge) {
          // Create notification
          await this.createBadgeEarnedNotification(userId, userBadge.badge);
          
          // Mark badge as notified
          await supabase
            .from('user_badges')
            .update({ is_notified: true })
            .eq('id', userBadge.id);
          
          notificationCount++;
        }
      }

      return notificationCount;
    } catch (err: unknown) {
      console.error('Error processing new badges:', err);
      throw err instanceof NotificationError 
        ? err 
        : new NotificationError(err instanceof Error ? err.message : 'Failed to process new badges');
    }
  }
}
