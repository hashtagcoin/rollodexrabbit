import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { 
  ArrowLeft, 
  CircleHelp as HelpCircle, 
  MessageSquare, 
  Mail, 
  Phone, 
  FileQuestion, 
  ChevronRight
} from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

type FaqItem = {
  question: string;
  answer: string;
};

export default function HelpScreen() {
  const faqs: FaqItem[] = [
    {
      question: 'How do I book a service?',
      answer: 'You can book services by browsing the Discover tab, selecting a service you\'re interested in, and following the booking process. Make sure your NDIS information is up to date in your profile.'
    },
    {
      question: 'How do I update my NDIS details?',
      answer: 'You can update your NDIS details in your profile settings. Go to Profile > Edit Profile > Update your NDIS number and other details.'
    },
    {
      question: 'Can I cancel a booking?',
      answer: 'Yes, you can cancel a booking by going to your profile, selecting the Bookings tab, finding the booking you want to cancel, and using the cancel option. Please note that cancellation policies may vary by service provider.'
    },
    {
      question: 'How do I join a group?',
      answer: 'You can join groups by browsing the Community tab, selecting a group you\'re interested in, and clicking the Join Group button. Some groups may require approval from administrators.'
    },
    {
      question: 'How do I make a claim?',
      answer: 'To make a claim, go to the Wallet tab and select "Submit Claim". Follow the instructions to enter your claim details, including invoice number and amount.'
    }
  ];

  return (
    <View style={styles.container}>
      <AppHeader title="Help & Support" />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.supportSection}>
          <HelpCircle size={48} color="#007AFF" style={styles.supportIcon} />
          <Text style={styles.supportTitle}>How can we help you?</Text>
          <Text style={styles.supportText}>
            Find answers to common questions or get in touch with our support team
          </Text>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          
          <TouchableOpacity style={styles.contactOption}>
            <View style={styles.contactIconContainer}>
              <MessageSquare size={24} color="#007AFF" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactDescription}>
                Chat with our support team
              </Text>
            </View>
            <ChevronRight size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactOption}>
            <View style={styles.contactIconContainer}>
              <Mail size={24} color="#007AFF" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactDescription}>
                support@rollodex.app
              </Text>
            </View>
            <ChevronRight size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactOption}>
            <View style={styles.contactIconContainer}>
              <Phone size={24} color="#007AFF" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Call Us</Text>
              <Text style={styles.contactDescription}>
                1800 ROLLODEX
              </Text>
            </View>
            <ChevronRight size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <View style={styles.faqQuestion}>
                <FileQuestion size={20} color="#007AFF" />
                <Text style={styles.questionText}>{faq.question}</Text>
              </View>
              <Text style={styles.answerText}>{faq.answer}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Have feedback or suggestions?</Text>
          <TouchableOpacity style={styles.feedbackButton}>
            <Text style={styles.feedbackButtonText}>Send Feedback</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  supportSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  supportIcon: {
    marginBottom: 16,
  },
  supportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  contactSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: '#666',
  },
  faqSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  faqItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  answerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  feedbackSection: {
    padding: 24,
    alignItems: 'center',
  },
  feedbackTitle: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  feedbackButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});