import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, MapPin, Star, Calendar, Clock, ChevronRight } from 'lucide-react-native';

export default function ServiceDetails() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  // This would normally be fetched from the API
  const service = {
    id: 1,
    name: 'HealthBridge Therapy',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2068&auto=format&fit=crop',
    category: 'Physiotherapy',
    rating: 4.9,
    reviews: 128,
    distance: '2.5 km',
    price: 120,
    description: 'Expert physiotherapy services tailored to your needs. Our experienced therapists use evidence-based techniques to help you achieve your mobility and recovery goals.',
    address: '123 Health Street, Melbourne VIC 3000',
    duration: '60 min',
    availableTimes: [
      '9:00 AM',
      '10:00 AM',
      '2:00 PM',
      '3:00 PM',
      '4:00 PM',
    ],
  };

  const handleBooking = () => {
    router.push({
      pathname: '/discover/booking',
      params: { serviceId: id },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image source={{ uri: service.image }} style={styles.image} />
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{service.name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={20} color="#FFB800" fill="#FFB800" />
              <Text style={styles.rating}>{service.rating}</Text>
              <Text style={styles.reviews}>({service.reviews} reviews)</Text>
            </View>
          </View>

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <MapPin size={20} color="#666" />
              <Text style={styles.metaText}>{service.address}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={20} color="#666" />
              <Text style={styles.metaText}>{service.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={20} color="#666" />
              <Text style={styles.metaText}>Available Today</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{service.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Times</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.timeSlots}
            >
              {service.availableTimes.map((time, index) => (
                <TouchableOpacity key={index} style={styles.timeSlot}>
                  <Text style={styles.timeText}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.priceSection}>
            <View>
              <Text style={styles.priceLabel}>Price per session</Text>
              <Text style={styles.price}>${service.price}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.bookButton, loading && styles.bookButtonDisabled]}
              onPress={handleBooking}
              disabled={loading}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  reviews: {
    fontSize: 16,
    color: '#666',
  },
  metaInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  timeSlots: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  timeSlot: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginRight: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonDisabled: {
    opacity: 0.7,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});