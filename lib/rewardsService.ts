import { supabase } from './supabase';

// Types for rewards system
export type Badge = {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  category: string;
  points: number;
  created_at: string;
  requirements: Record<string, boolean>;
  is_active: boolean;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  is_claimed: boolean;
  claimed_at: string | null;
  badge?: Badge;
};

export type UserStreak = {
  id: string;
  user_id: string;
  streak_type: string;
  current_count: number;
  longest_count: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
};

export type UserPoints = {
  id: string;
  user_id: string;
  total_points: number;
  available_points: number;
  lifetime_points: number;
  created_at: string;
  updated_at: string;
};

export type PointTransaction = {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_type: string;
  progress: number;
  target: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

// Error handling for rewards service
export class RewardsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RewardsError';
  }
}

/**
 * Rewards Service - Handles all rewards, achievements, badges, and points functionality
 */
export class RewardsService {
  /**
   * Get all badges for a user
   * @param userId User ID
   * @returns Array of user badges with badge details
   */
  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      // First try with the relationship approach
      try {
        const { data, error } = await supabase
          .from('user_badges')
          .select(`
            *,
            badge:badge_definitions(*)
          `)
          .eq('user_id', userId);

        if (error) throw error;
        return data || [];
      } catch (relationshipError) {
        console.error('Error using relationship query:', relationshipError);
        
        // Fallback: Get user badges and badge definitions separately
        const { data: userBadgesData, error: userBadgesError } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', userId);
          
        if (userBadgesError) throw new RewardsError(userBadgesError.message);
        
        // If we have user badges, fetch the badge definitions for each
        if (userBadgesData && userBadgesData.length > 0) {
          const badgeIds = userBadgesData.map(badge => badge.badge_id);
          
          const { data: badgeDefinitionsData, error: badgeDefinitionsError } = await supabase
            .from('badge_definitions')
            .select('*')
            .in('id', badgeIds);
            
          if (badgeDefinitionsError) throw new RewardsError(badgeDefinitionsError.message);
          
          // Combine the data
          const combinedData = userBadgesData.map(userBadge => {
            const badgeDefinition = badgeDefinitionsData?.find(def => def.id === userBadge.badge_id);
            return {
              ...userBadge,
              badge: badgeDefinition || null
            };
          });
          
          return combinedData;
        }
        
        return userBadgesData || [];
      }
    } catch (err: unknown) {
      console.error('Error getting user badges:', err);
      throw err instanceof RewardsError 
        ? err 
        : new RewardsError(err instanceof Error ? err.message : 'Failed to get user badges');
    }
  }

  /**
   * Get user points information
   * @param userId User ID
   * @returns User points object or null if not found
   */
  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw new RewardsError(error.message);
      return data;
    } catch (err: unknown) {
      console.error('Error getting user points:', err);
      throw err instanceof RewardsError 
        ? err 
        : new RewardsError(err instanceof Error ? err.message : 'Failed to get user points');
    }
  }

  /**
   * Get user streaks
   * @param userId User ID
   * @returns Array of user streaks
   */
  static async getUserStreaks(userId: string): Promise<UserStreak[]> {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId);

      if (error) throw new RewardsError(error.message);
      return data || [];
    } catch (err: unknown) {
      console.error('Error getting user streaks:', err);
      throw err instanceof RewardsError 
        ? err 
        : new RewardsError(err instanceof Error ? err.message : 'Failed to get user streaks');
    }
  }

  /**
   * Get user achievements
   * @param userId User ID
   * @returns Array of user achievements
   */
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      if (error) throw new RewardsError(error.message);
      return data || [];
    } catch (err: unknown) {
      console.error('Error getting user achievements:', err);
      throw err instanceof RewardsError 
        ? err 
        : new RewardsError(err instanceof Error ? err.message : 'Failed to get user achievements');
    }
  }

  /**
   * Update a user streak
   * @param userId User ID
   * @param streakType Type of streak (e.g., 'login', 'booking')
   * @returns Success status
   */
  static async updateUserStreak(userId: string, streakType: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_user_streak', {
        p_user_id: userId,
        p_streak_type: streakType
      });

      if (error) throw new RewardsError(error.message);
      return true;
    } catch (err: unknown) {
      console.error('Error updating user streak:', err);
      throw err instanceof RewardsError 
        ? err 
        : new RewardsError(err instanceof Error ? err.message : 'Failed to update user streak');
    }
  }

  /**
   * Award points to a user
   * @param userId User ID
   * @param amount Amount of points to award
   * @param transactionType Type of transaction
   * @param description Optional description
   * @param referenceId Optional reference ID
   * @returns Success status
   */
  static async awardPoints(
    userId: string,
    amount: number,
    transactionType: string,
    description?: string,
    referenceId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('award_points', {
        p_user_id: userId,
        p_amount: amount,
        p_transaction_type: transactionType,
        p_description: description || null,
        p_reference_id: referenceId || null
      });

      if (error) throw new RewardsError(error.message);
      return true;
    } catch (err: unknown) {
      console.error('Error awarding points:', err);
      throw err instanceof RewardsError 
        ? err 
        : new RewardsError(err instanceof Error ? err.message : 'Failed to award points');
    }
  }

  /**
   * Update achievement progress
   * @param userId User ID
   * @param achievementType Type of achievement
   * @param progressIncrement Amount to increment progress by
   * @param target Optional target value
   * @returns Whether the achievement was completed
   */
  static async updateAchievementProgress(
    userId: string,
    achievementType: string,
    progressIncrement: number = 1,
    target?: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_achievement_progress', {
        p_user_id: userId,
        p_achievement_key: achievementType,
        p_progress_increment: progressIncrement
      });

      if (error) throw new RewardsError(error.message);
      return data || false;
    } catch (err: unknown) {
      console.error('Error updating achievement progress:', err);
      throw err instanceof RewardsError 
        ? err 
        : new RewardsError(err instanceof Error ? err.message : 'Failed to update achievement progress');
    }
  }

  /**
   * Check and award badges based on achievements
   * @param userId User ID
   * @returns Array of awarded badge IDs and names
   */
  static async checkAndAwardBadges(userId: string): Promise<{badge_id: string, badge_name: string}[]> {
    try {
      const { data, error } = await supabase.rpc('check_and_award_badges', {
        p_user_id: userId
      });

      if (error) throw new RewardsError(error.message);
      return data || [];
    } catch (err: unknown) {
      console.error('Error checking and awarding badges:', err);
      throw err instanceof RewardsError 
        ? err 
        : new RewardsError(err instanceof Error ? err.message : 'Failed to check and award badges');
    }
  }

  /**
   * Claim a badge to receive its points
   * @param userId User ID
   * @param badgeId Badge ID
   * @returns Success status
   */
  static async claimBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      // First check if the badge exists and is unclaimed
      const { data: badgeData, error: badgeError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .eq('is_claimed', false)
        .single();

      if (badgeError) throw new RewardsError(badgeError.message);
      if (!badgeData) throw new RewardsError('Badge not found or already claimed');

      // Update the badge to claimed status
      const { error: updateError } = await supabase
        .from('user_badges')
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString()
        })
        .eq('id', badgeData.id);

      if (updateError) throw new RewardsError(updateError.message);

      // Get the badge details to know how many points to award
      const { data: badgeDetails, error: detailsError } = await supabase
        .from('badge_definitions')
        .select('points')
        .eq('id', badgeId)
        .single();

      if (detailsError) throw new RewardsError(detailsError.message);

      // Award the points
      await this.awardPoints(
        userId,
        badgeDetails.points,
        'BADGE_CLAIMED',
        `Claimed badge: ${badgeId}`,
        badgeId
      );

      return true;
    } catch (err: unknown) {
      console.error('Error claiming badge:', err);
      throw err instanceof RewardsError 
        ? err 
        : new RewardsError(err instanceof Error ? err.message : 'Failed to claim badge');
    }
  }

  /**
   * Track an activity and update relevant achievements and streaks
   * @param userId User ID
   * @param activityType Type of activity
   * @param metadata Additional metadata about the activity
   */
  static async trackActivity(
    userId: string,
    activityType: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Different activities trigger different achievements and streaks
      switch (activityType) {
        case 'login':
          // Update login streak
          await this.updateUserStreak(userId, 'login');
          
          // Check login count achievement
          const loginCount = metadata.loginCount || 1;
          if (loginCount % 7 === 0) {
            // Every 7 logins, update the login streak achievement
            await this.updateAchievementProgress(userId, 'login_streak', 1, 1);
          }
          break;
          
        case 'profile_update':
          // If profile is complete, mark the achievement
          if (metadata.isComplete) {
            await this.updateAchievementProgress(userId, 'profile_complete', 1, 1);
          }
          break;
          
        case 'join_group':
          // Increment groups joined count
          await this.updateAchievementProgress(userId, 'groups_joined_count', 1, 3);
          
          // If they've joined 3 or more groups, mark the achievement
          if (metadata.totalGroups >= 3) {
            await this.updateAchievementProgress(userId, 'groups_joined', 1, 1);
          }
          break;
          
        case 'create_group':
          // Mark group created achievement
          await this.updateAchievementProgress(userId, 'group_created', 1, 1);
          
          // If the group has 5+ members, mark that achievement too
          if (metadata.memberCount >= 5) {
            await this.updateAchievementProgress(userId, 'group_members', 1, 1);
          }
          break;
          
        case 'book_service':
          // Update service booking streak
          await this.updateUserStreak(userId, 'booking');
          
          // Increment services booked count
          await this.updateAchievementProgress(userId, 'services_booked_count', 1, 5);
          
          // If they've booked 5 or more services, mark the achievement
          if (metadata.totalBookings >= 5) {
            await this.updateAchievementProgress(userId, 'services_booked', 1, 1);
          }
          break;
          
        case 'view_housing':
          // Increment housing views count
          await this.updateAchievementProgress(userId, 'housing_views_count', 1, 10);
          
          // If they've viewed 10 or more listings, mark the achievement
          if (metadata.totalViews >= 10) {
            await this.updateAchievementProgress(userId, 'housing_views', 1, 1);
          }
          break;
          
        case 'submit_claim':
          // Increment claims submitted count
          await this.updateAchievementProgress(userId, 'claims_submitted_count', 1, 3);
          
          // If they've submitted 3 or more claims, mark the achievement
          if (metadata.totalClaims >= 3) {
            await this.updateAchievementProgress(userId, 'claims_submitted', 1, 1);
          }
          break;
          
        case 'submit_review':
          // Increment reviews submitted count
          await this.updateAchievementProgress(userId, 'reviews_submitted_count', 1, 5);
          
          // If they've submitted 5 or more reviews, mark the achievement
          if (metadata.totalReviews >= 5) {
            await this.updateAchievementProgress(userId, 'reviews_submitted', 1, 1);
          }
          break;
          
        default:
          // For any other activity types, just log them
          console.log(`Unhandled activity type: ${activityType}`);
      }
      
      // After updating achievements, check if any new badges should be awarded
      await this.checkAndAwardBadges(userId);
      
    } catch (err: unknown) {
      console.error('Error tracking activity:', err);
      // Don't throw here - we don't want to disrupt the user experience for rewards tracking
      // Just log the error and continue
    }
  }
}
