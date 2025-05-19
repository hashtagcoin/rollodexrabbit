import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import SignatureCapture from 'react-native-signature-capture';

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
      yPosition -= 20;

      // Signature
      const signatureBase64 = signatureData.replace('data:image/png;base64,', '');
      const signatureImageBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
      page.drawImage(signatureImage, { x: 50, y: yPosition - 60, width: 150, height: 45 }); // Adjust y as needed
      page.drawText('Participant Signature', { x: 50, y: yPosition - 70, size: 10, font });
      yPosition -= 90; 

      page.drawText(`Signed Electronically On: ${new Date().toLocaleString()}`, { x: 50, y: yPosition, size: 10, font });
      yPosition -= 15;
      page.drawText(`IP Address: ${ipAddress}`, { x: 50, y: yPosition, size: 8, font });
      yPosition -= 15;
      page.drawText(`User Agent: ${userAgent}`, { x: 50, y: yPosition, size: 8, font, maxWidth: width - 100 });


      // 4. Save PDF
      const pdfBytesArray = await pdfDoc.save();
      const pdfBase64 = await pdfDoc.saveAsBase64(); // For local saving if needed, or direct use
      
      // Get current user for file path
      const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
      if (!currentAuthUser) throw new Error('User not authenticated');
      
      const localPdfUri = FileSystem.cacheDirectory + `agreement_${currentAuthUser.id}_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(localPdfUri, pdfBase64, { encoding: FileSystem.EncodingType.Base64 });
      
      // 5. Upload PDF to Supabase Storage
      // Reuse the authenticated user we already have
      if (!currentAuthUser) throw new Error('User not authenticated');
      
      // Create a unique filename with user ID and timestamp
      const fileName = `service_agreements/${currentAuthUser.id}/agreement_${serviceIdParam}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('participant-agreements')
        .upload(fileName, pdfBytesArray, { contentType: 'application/pdf', upsert: false });
      if (uploadError) throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      
      // 6. Get public URL
      const { data: publicUrlData } = supabase.storage.from('participant-agreements').getPublicUrl(fileName);
      const uploadedPdfUrl = publicUrlData?.publicUrl;
      if (!uploadedPdfUrl) throw new Error('Failed to get public URL for PDF.');
      setPdfUrl(uploadedPdfUrl);

      // 7. Update/Insert agreement record in Supabase table
      if (!currentAuthUser) throw new Error('User not authenticated for final save.');

      const agreementRecord = {
        participant_user_id: currentAuthUser.id,
        service_listing_id: serviceIdParam, // Assuming serviceIdParam is the foreign key to service_listings
        agreement_pdf_url: uploadedPdfUrl,
        signed_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        // booking_id: bookingId, // If you want to associate with a booking
        // agreement_version_id: some_version_id, // If you have versioning
      };

      const { error: dbError } = await supabase
        .from('participant_signed_agreements')
        .insert(agreementRecord); // Using insert, adjust if update is needed
      if (dbError) throw new Error(`Failed to save agreement record: ${dbError.message}`);
      
      setShowConfirmation(true);

    } catch (err: any) {
      console.error("Error in handleSign:", err);
      setError(err.message || 'Failed to sign and save agreement.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !serviceDetails) { // Show loading only on initial data fetch
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16 }}>Loading service details...</Text>
      </View>
    );
  }

  if (showConfirmation && pdfUrl) {
    return (
      <View style={styles.container}>
        <AppHeader title="Agreement Signed" showBackButton={false} />
        <View style={styles.centeredContainerPadded}>
          <CheckSquare size={64} color="#28a745" style={{ marginBottom: 20 }} />
          <Text style={styles.confirmationTitle}>Thank you!</Text>
          <Text style={styles.confirmationText}>
            Your agreement has been signed and securely stored. You can view or download it.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#007AFF', marginBottom: 16 }]}
            onPress={async () => {
              try {
                if (await Sharing.isAvailableAsync()) {
                    // For sharing remote URL directly:
                    await Sharing.shareAsync(pdfUrl, { dialogTitle: 'Share Signed Agreement', mimeType: 'application/pdf' });
                    // If you want to share the local copy (requires localPdfUri to be accessible or re-saved):
                    // const tempLocalPdfUri = FileSystem.cacheDirectory + `shared_agreement.pdf`;
                    // await FileSystem.downloadAsync(pdfUrl, tempLocalPdfUri);
                    // await Sharing.shareAsync(tempLocalPdfUri);

                } else {
                  Linking.openURL(pdfUrl);
                }
              } catch (shareError) {
                console.error("Sharing error:", shareError);
                alert("Could not share the document. You can try opening it in your browser.");
                Linking.openURL(pdfUrl);
              }
            }}
          >
            <Text style={styles.actionButtonText}>View / Share Agreement</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#6c757d' }]}
            onPress={() => {
              setShowConfirmation(false);
              setPdfUrl(null);
              setSignatureData(null);
              setHasDrawn(false);
              setAgreed(false);
              if (router.canGoBack()) {
                router.back();
              } else {
                // Navigate to home using the correct route
                router.replace({
                  pathname: '/',
                  params: { screen: 'home' }
                });
              }
            }}
          >
            <Text style={styles.actionButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (!serviceDetails && !loading) { // Error state if serviceDetails couldn't load
    return (
      <View style={styles.container}>
        <AppHeader 
          title="Service Agreement" 
          showBackButton 
          onBackPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace({
                pathname: '/',
                params: { screen: 'home' }
              });
            }
          }} 
        />
        <View style={styles.centeredContainerPadded}>
            <AlertCircle size={48} color="#dc3545" style={{ marginBottom: 20 }} />
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#dc3545', marginBottom: 10 }}>Error Loading Details</Text>
          <Text style={{ fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 20 }}>
            {error || 'Unable to load service details. Please check your connection and try again.'}
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: '#007AFF'}]}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace({
                  pathname: '/',
                  params: { screen: 'home' }
                });
              }
            }}
          >
            <Text style={styles.actionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Render null or a minimal loader if serviceDetails is still null but not in an error state
  // This case should ideally be covered by the loading state or error state above.
  if (!serviceDetails) return null; 


  return (
    <View style={styles.container}>
      <AppHeader title="Service Agreement" showBackButton onBackPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace({
            pathname: '/',
            params: { screen: 'home' }
          });
        }
      }} />
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <Text style={styles.mainTitle}>Service Agreement</Text>
        
        <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Service Details</Text>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Participant:</Text><Text style={styles.detailValue}>{participantName}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Service:</Text><Text style={styles.detailValue}>{serviceDetails.name}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Provider:</Text><Text style={styles.detailValue}>{serviceDetails.provider}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Date:</Text><Text style={styles.detailValue}>{serviceDetails.date}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Time:</Text><Text style={styles.detailValue}>{serviceDetails.time}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Duration:</Text><Text style={styles.detailValue}>{serviceDetails.duration}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Price:</Text><Text style={styles.detailValue}>{serviceDetails.price}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms and Conditions</Text>
          <ScrollView style={styles.termsContainer} nestedScrollEnabled={true}>
            <Text style={styles.termsText}>
              This Service Agreement is made between you ({participantName}) as a participant in the National Disability Insurance Scheme (NDIS) and {serviceDetails.provider} (the service provider).
              {"\n\n"}
              By signing this agreement, you agree to the following terms:
              {"\n"}1. The service provider will deliver the services as described above.
              {"\n"}2. You agree to pay the specified amount for the services rendered.
              {"\n"}3. Cancellations require 24 hours notice. Less notice may incur a fee.
              {"\n"}4. The service provider will maintain confidentiality of your information in accordance with privacy laws.
              {"\n"}5. Any complaints or feedback can be directed to the service provider in the first instance. If unresolved, you may contact the NDIS Quality and Safeguards Commission.
              {"\n\n"}
              This agreement is subject to the terms of the NDIS Act 2013, NDIS Rules, and relevant Australian consumer law. Both parties agree to work together in good faith to resolve any disputes.
            </Text>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Signature</Text>
          {error && ( // Display general errors here
            <View style={styles.errorBox}>
                <AlertCircle color="#D32F2F" size={20} style={{marginRight: 10}}/>
                <Text style={styles.errorTextGlobal}>{error}</Text>
            </View>
          )}

          {!signatureData && !showCanvas && (
            <TouchableOpacity
              style={[styles.actionButton, {backgroundColor: '#007AFF'}]}
              onPress={() => { setShowCanvas(true); setError(null); }}
            >
              <Text style={styles.actionButtonText}>Tap to Sign</Text>
            </TouchableOpacity>
          )}

          {showCanvas && (
            <View style={styles.canvasOuterContainer}>
              <Text style={styles.canvasInstruction}>Please sign in the box below:</Text>
              <View style={styles.canvasInnerContainer}>
                <SignatureCapture
                  ref={signatureRef as any}
                  style={styles.signatureCanvas}
                  onSaveEvent={handleSaveSignature}
                  onDragEvent={handleDragEvent}
                  saveImageFileInExtStorage={false}
                  showNativeButtons={false}
                  showTitleLabel={false}
                  viewMode="portrait"
                />
              </View>
              <View style={styles.canvasButtonsContainer}>
                <TouchableOpacity
                  style={[styles.canvasButton, styles.canvasClearButton]}
                  onPress={() => {
                    signatureRef.current?.resetImage();
                    setHasDrawn(false); // Reset canvas draw state
                  }}
                >
                  <Text style={styles.canvasButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.canvasButton, styles.canvasSaveButton]}
                  onPress={() => signatureRef.current?.saveImage()}
                >
                  <Text style={styles.canvasButtonText}>Confirm Signature</Text>
                </TouchableOpacity>
              </View>
               <TouchableOpacity onPress={() => setShowCanvas(false)} style={styles.cancelSignatureButton}>
                <Text style={styles.cancelSignatureText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {signatureData && !showCanvas && (
            <View style={styles.signedAreaContainer}>
              <Text style={styles.signedLabel}>Your Captured Signature:</Text>
              <Image source={{ uri: signatureData }} style={styles.signaturePreview} />
              <TouchableOpacity
                style={styles.changeSignatureButton}
                onPress={() => {
                  setSignatureData(null);
                  setHasDrawn(false);
                  setShowCanvas(true);
                  setError(null);
                }}
              >
                <Text style={styles.changeSignatureButtonText}>Change Signature</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={styles.checkboxBase}
            onPress={() => setAgreed(!agreed)}
          >
            {agreed && <CheckSquare size={24} color="#007AFF" />}
          </TouchableOpacity>
          <Text style={styles.checkboxLabelText} onPress={() => setAgreed(!agreed)}>
            I have read, understood, and agree to the terms and conditions outlined in this Service Agreement.
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.finalAcceptButton,
            (!signatureData || !agreed || loading) ? styles.actionButtonDisabled : styles.actionButtonActive,
          ]}
          onPress={handleSign}
          disabled={!signatureData || !agreed || loading}
        >
          {loading && serviceDetails ? // Show loading indicator on button if processing submission
            <ActivityIndicator size="small" color="#fff" /> :
            <Text style={styles.actionButtonText}>Accept & Submit Agreement</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
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