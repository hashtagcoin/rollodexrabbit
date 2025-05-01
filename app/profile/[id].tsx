import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import AppHeader from '../../components/AppHeader'; // Assuming AppHeader is in components folder

// Define interfaces for profile and post data (adjust as needed)
interface UserProfile {
    id: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string; // Add other fields you want to display
    // Add follower/following counts if available
}

interface UserPost {
    id: string;
    content?: string;
    image_url?: string; // Assuming posts can have images
    created_at: string;
    // Add user details if not joining directly
}

const UserProfileScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>(); // Get the user ID from the route
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<UserPost[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError("User ID not provided.");
            setLoadingProfile(false);
            setLoadingPosts(false);
            return;
        }

        const fetchProfile = async () => {
            setLoadingProfile(true);
            console.log(`[UserProfileScreen] Fetching profile for ID: ${id}`);
            const { data, error: profileError } = await supabase
                .from('user_profiles')
                .select('*') // Select specific fields later for optimization
                .eq('id', id)
                .single(); // Expect only one profile

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                setError(`Failed to load profile: ${profileError.message}`);
                setProfile(null);
            } else {
                console.log('[UserProfileScreen] Profile data:', data);
                setProfile(data);
                setError(null); // Clear previous errors
            }
            setLoadingProfile(false);
        };

        const fetchPosts = async () => {
            setLoadingPosts(true);
            console.log(`[UserProfileScreen] Fetching posts from 'group_posts' for user ID: ${id}`);
            // *** Querying the correct 'group_posts' table ***
            const { data, error: postsError } = await supabase
                .from('group_posts') // Correct table name based on schema check
                .select('id, content, image_url, created_at') // Select the columns you need for display
                .eq('user_id', id) // Filter by the user whose profile is being viewed
                .order('created_at', { ascending: false }); // Show newest posts first

            if (postsError) {
                console.error('Error fetching posts:', postsError);
                 // Append posts error without overwriting potential profile error
                 setError(prev => prev ? `${prev}\nFailed to load posts: ${postsError.message}` : `Failed to load posts: ${postsError.message}`);
                setPosts([]);
            } else {
                console.log('[UserProfileScreen] Posts data:', data);
                setPosts(data || []);
                // If profile fetch was okay, no need to change error state here
            }
             setLoadingPosts(false);
        };

        fetchProfile();
        fetchPosts();

    }, [id]); // Re-run effect if the ID changes

    // --- Rendering Logic ---

    if (loadingProfile) {
        return (
            <View style={styles.container}>
                <AppHeader />
                <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
            </View>
        );
    }

    if (error && !profile) { // Show error prominently if profile failed to load
         return (
            <View style={styles.container}>
                <AppHeader />
                <Text style={styles.errorText}>{error}</Text>
            </View>
         );
    }

     if (!profile) { // Should ideally be caught by error state, but as fallback
         return (
            <View style={styles.container}>
                <AppHeader />
                <Text style={styles.errorText}>User profile not found.</Text>
            </View>
         );
    }

    // Helper to render each post item (customize heavily)
    const renderPostItem = ({ item }: { item: UserPost }) => (
        <View style={styles.postItem}>
            {/* Add post content, image, timestamp etc. */}
            {item.image_url && <Image source={{ uri: item.image_url }} style={styles.postImage} />}
            <Text style={styles.postContent}>{item.content || 'No content'}</Text>
            <Text style={styles.postTimestamp}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
    );

    const avatarUri = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'NA')}&background=random`;


    return (
        <View style={styles.container}>
            <AppHeader />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Profile Header Section */}
                <View style={styles.profileHeader}>
                    <Image source={{ uri: avatarUri }} style={styles.profileAvatar} />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{profile.full_name || 'Unnamed User'}</Text>
                        {profile.bio && <Text style={styles.profileBio}>{profile.bio}</Text>}
                         {/* Add Follower/Following Counts, Edit Profile button if it's the current user, etc. */}
                    </View>
                    {/* Potentially add Follow/Message buttons here if it's not the current user */}
                </View>

                {/* Divider */}
                 <View style={styles.divider} />

                 {/* User Posts Section */}
                 <Text style={styles.postsHeader}>Posts</Text>
                 {loadingPosts ? (
                    <ActivityIndicator size="small" color="#666" />
                 ) : posts.length > 0 ? (
                    // Using FlatList inside ScrollView isn't ideal for performance with many items,
                    // but okay for moderate amounts. Consider alternatives for very long lists.
                    <FlatList
                        data={posts}
                        renderItem={renderPostItem}
                        keyExtractor={(item) => item.id}
                        // style={styles.postsList} // Add style if needed
                        scrollEnabled={false} // Disable FlatList scrolling since ScrollView handles it
                    />
                 ) : (
                    <Text style={styles.noPostsText}>This user hasn't posted anything yet.</Text>
                 )}
                {error && <Text style={styles.errorText}>{error}</Text>} {/* Show posts loading error */}

            </ScrollView>
        </View>
    );
};

// --- Styles (Basic - customize extensively) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        paddingBottom: 20, // Ensure content doesn't hide behind potential bottom bars
    },
    loader: {
        marginTop: 50,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        margin: 20,
        fontSize: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 15,
        backgroundColor: '#e1e4ea',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    profileBio: {
        fontSize: 14,
        color: '#555',
    },
     divider: {
        height: 10, // Or use margin/padding
        backgroundColor: '#f0f0f0' // Light separator
    },
    postsHeader: {
        fontSize: 18,
        fontWeight: '600',
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 10,
    },
    postsList: {
        // Style if needed
    },
    postItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    postImage: {
        width: '100%',
        height: 200, // Adjust as needed
        resizeMode: 'cover',
        marginBottom: 10,
        borderRadius: 5,
    },
    postContent: {
         fontSize: 14,
         marginBottom: 5,
    },
    postTimestamp: {
        fontSize: 12,
        color: '#888',
    },
    noPostsText: {
        textAlign: 'center',
        marginTop: 30,
        color: '#888',
        fontSize: 16,
    }
});

export default UserProfileScreen;