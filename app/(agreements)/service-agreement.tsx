import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
// Only import SignatureCapture on native platforms
const SignatureCapture = Platform.OS !== 'web' ? require('react-native-signature-capture').default : undefined;

// Type definitions for react-native-signature-capture
type SignatureCaptureRef = {
  resetImage: () => void;
  saveImage: () => void;
};

type SignatureCaptureProps = {
  ref?: React.RefObject<SignatureCaptureRef>;
  style?: any;
  onSaveEvent?: (result: { encoded: string; pathName: string }) => void;
  onDragEvent?: () => void;
  saveImageFileInExtStorage?: boolean;
  showNativeButtons?: boolean;
  showTitleLabel?: boolean;
  viewMode?: 'portrait' | 'landscape';
  minStrokeWidth?: number;
  maxStrokeWidth?: number;
};

import { supabase } from '../../lib/supabase';
import { SquareCheck as CheckSquare, CircleAlert as AlertCircle } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader'; // Assuming AppHeader is correctly implemented

interface ServiceDetails {
  name: string;
  provider: string;
  date: string;
  time: string;
  duration: string;
  price: string;
}

export default function ServiceAgreementScreen() {
  const { serviceId: serviceIdParam, bookingId } = useLocalSearchParams<{ serviceId?: string; bookingId?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [participantName, setParticipantName] = useState<string>('');
  const [agreed, setAgreed] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false); // To enable save button on canvas
  const [signatureData, setSignatureData] = useState<string | null>(null); // base64 image data
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // For the generated PDF
  const [hasSignedAgreement, setHasSignedAgreement] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [providerName, setProviderName] = useState<string>('');
  const [providerVerified, setProviderVerified] = useState<boolean>(false);
  
  const router = useRouter();
  const signatureRef = useRef<SignatureCaptureRef | null>(null);

  // Fetch participant's name and service details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Get current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !currentUser) throw new Error(userError?.message || 'User not authenticated');
        
        // 2. Fetch service details
        if (serviceIdParam) {
          const { data: serviceData, error: serviceError } = await supabase
            .from('service_listings')
            .select('*')
            .eq('id', serviceIdParam)
            .single();
          
          if (serviceError) throw new Error(`Failed to fetch service: ${serviceError.message}`);
          if (!serviceData) throw new Error('Service not found');
          
          setServiceDetails(serviceData);
          
          // 3. Fetch provider details
          if (serviceData.provider_id) {
            const { data: providerData, error: providerError } = await supabase
              .from('service_providers')
              .select('business_name, ndis_verified')
              .eq('id', serviceData.provider_id)
              .single();
              
            if (!providerError && providerData) {
              setProviderName(providerData.business_name || 'Unknown Provider');
              setProviderVerified(!!providerData.ndis_verified);
            }
          }
          
          // 4. Check if agreement already signed for this service
          const { data: existingAgreement, error: agreementError } = await supabase
            .from('participant_signed_agreements')
            .select('agreement_pdf_url')
            .eq('participant_user_id', currentUser.id)
            .eq('service_listing_id', serviceIdParam)
            .maybeSingle();
            
          if (existingAgreement?.agreement_pdf_url) {
            setPdfUrl(existingAgreement.agreement_pdf_url);
            setHasSignedAgreement(true);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [serviceIdParam]);

  const handleSaveSignature = (result: { encoded: string; pathName: string }) => {
    setSignatureData(`data:image/png;base64,${result.encoded}`);
    setHasDrawn(true); // hasDrawn here means signature is saved
    setShowCanvas(false);
    setError(null);
  };

  const handleDragEvent = () => {
    // This callback is called when the user starts drawing on canvas
    if (!hasDrawn && showCanvas) { // Set hasDrawn for canvas interaction, not final save
        // This state could be used to enable the "Confirm Signature" button on canvas
    }
  };

  const handleSign = async () => {
    if (!serviceIdParam) {
      setError('Service ID is missing. Cannot proceed.');
      return;
    }
    if (!serviceDetails) {
      setError('Service details are not loaded. Cannot proceed.');
      return;
    }
    if (!signatureData) {
      setError('Please provide your signature by tapping "Tap to Sign" and confirming.');
      return;
    }
    if (!agreed) {
      setError('Please read and agree to the terms and conditions.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch IP address
      let ipAddress = null;
      try {
        const ipRes = await fetch('https://api64.ipify.org?format=json');
        const ipJson = await ipRes.json();
        ipAddress = ipJson.ip || 'IP Not Found';
      } catch (ipError) {
        console.warn('Could not fetch IP address:', ipError);
        ipAddress = 'IP Fetch Failed';
      }
      
      // 2. Get user agent
      const userAgent = `${Device.osName || 'UnknownOS'} ${Device.osVersion || ''} / ${Device.modelName || 'UnknownModel'}`;
      
      // 3. Generate PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 size
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let yPosition = height - 60;
      const drawLine = () => {
        yPosition -= 5;
        page.drawLine({start: {x: 50, y: yPosition}, end: {x: width - 50, y: yPosition}, thickness: 0.5, color: rgb(0.8,0.8,0.8)});
        yPosition -= 15;
      }

      page.drawText('NDIS Service Agreement', { x: 50, y: yPosition, size: 22, font: boldFont, color: rgb(0, 0.2, 0.6) });
      yPosition -= 30;
      page.drawText(`Participant: ${participantName}`, { x: 50, y: yPosition, size: 12, font });
      yPosition -= 20;
      page.drawText(`Provider: ${serviceDetails.provider}`, { x: 50, y: yPosition, size: 12, font });
      yPosition -= 20;
      page.drawText(`Service: ${serviceDetails.name}`, { x: 50, y: yPosition, size: 12, font });
      yPosition -= 20;
      page.drawText(`Date of Agreement: ${new Date().toLocaleDateString()}`, { x: 50, y: yPosition, size: 12, font });
      yPosition -= 20;
      page.drawText(`Service Date & Time: ${serviceDetails.date} ${serviceDetails.time}`, { x: 50, y: yPosition, size: 12, font });
      yPosition -= 20;
      page.drawText(`Service Duration: ${serviceDetails.duration}`, { x: 50, y: yPosition, size: 12, font });
      yPosition -= 20;
      page.drawText(`Service Price: ${serviceDetails.price}`, { x: 50, y: yPosition, size: 12, font });
      yPosition -= 30;

      page.drawText('Agreement Terms:', { x: 50, y: yPosition, size: 14, font: boldFont });
      yPosition -= 20;
      const terms = [
        "This Service Agreement is made between you as a participant in the National Disability Insurance Scheme (NDIS) and the service provider.",
        "By signing this agreement, you agree to the following terms:",
        "1. The service provider will deliver the services as described.",
        "2. You agree to pay the specified amount for the services rendered.",
        "3. Cancellations require 24 hours notice.",
        "4. The service provider will maintain confidentiality of your information.",
        "5. Any complaints can be directed to the service provider in the first instance.",
        "This agreement is subject to the terms of the NDIS and relevant legislation."
      ];
      terms.forEach(term => {
        page.drawText(term, { x: 50, y: yPosition, size: 10, font, maxWidth: width - 100, lineHeight: 12 });
        yPosition -= (term.split('\n').length * 12 + 5); // Adjust for multi-line and spacing
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      // ...rest of PDF generation logic continues here
    }
  };


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC', // Light background color
  },
  scrollContentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7FC',
  },
  centeredContainerPadded: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff'
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1A2B4D', // Dark blue
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  detailsSection: { // Specific styling for details if needed, otherwise use 'section'
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
    marginRight: 10,
  },
  detailValue: {
    fontSize: 14,
    color: '#222',
    flexShrink: 1, // Allow text to wrap
    textAlign: 'right',
  },
  termsContainer: {
    maxHeight: 200, // Make terms scrollable if long
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#F9F9F9',
  },
  termsText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#444',
  },
  // Signature Canvas
  canvasOuterContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  canvasInstruction: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
  },
  canvasInnerContainer: {
    width: '100%',
    height: 180,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: '#FFFFFF', // White background for canvas
    overflow: 'hidden', // Clip signature to bounds
  },
  signatureCanvas: {
    flex: 1, // Fill the container
    // backgroundColor: 'rgba(0,0,0,0.01)', // Slightly off-white for better visibility if needed
  },
  canvasButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 15,
  },
  canvasButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  canvasClearButton: {
    backgroundColor: '#FFC107', // Amber
  },
  canvasSaveButton: {
    backgroundColor: '#4CAF50', // Green
  },
  canvasButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelSignatureButton: {
    marginTop: 10,
    padding: 5,
  },
  cancelSignatureText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  // Signed Area
  signedAreaContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    marginTop: 10,
  },
  signedLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  signaturePreview: {
    width: 200,
    height: 60,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
  },
  changeSignatureButton: {
    marginTop: 12,
    backgroundColor: '#E9ECEF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  changeSignatureButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items to start for multi-line text
    marginVertical: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  checkboxBase: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2, // Align with first line of text
  },
  checkboxLabelText: {
    flex: 1, // Take remaining space
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  // Action Buttons (general)
  actionButton: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonDisabled: {
    backgroundColor: '#A9A9A9', // Grey out when disabled
  },
  actionButtonActive: { // For final accept button when active
     backgroundColor: '#28a745', // Green for active submit
  },
  finalAcceptButton: { // Specific style for the main submit button
    marginTop: 10,
  },
  // Error Display
  errorBox: {
    backgroundColor: '#FFEBEE', // Light red
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F', // Darker red
  },
  errorTextGlobal: {
    color: '#B71C1C', // Dark red text
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  // Confirmation Screen
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    color: '#555',
    lineHeight: 22,
  },
});