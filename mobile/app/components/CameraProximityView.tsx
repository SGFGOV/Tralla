import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  Alert
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

import proximityManager, { ProximityMethod, NearbyUser } from '../utils/proximityManager';
import cameraManager, { DetectedFace } from '../utils/cameraManager';

const { width } = Dimensions.get('window');

// Component to show camera-based proximity detection
const CameraProximityView: React.FC<{
  userId: any;
  onClose: any;
  onUserSelect: any;
}> = ({ userId, onClose, onUserSelect }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [showUserDetail, setShowUserDetail] = useState<boolean>(false);
  const [cameraInitialized, setCameraInitialized] = useState<boolean>(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  
  // Initialize proximity detection on component mount
  useEffect(() => {
    async function setupDetection() {
      try {
        setIsLoading(true);
        
        // Initialize camera specifically for this view
        const cameraResult = await cameraManager.init();
        setCameraInitialized(cameraResult.initialized);
        
        // Set callback for user updates
        proximityManager.onUsersUpdateCallback = (users: any) => {
          setNearbyUsers(users);
        };
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error setting up camera detection:', error);
        proximityManager.onUsersUpdateCallback = null;
        setIsLoading(false);
      }
    }
    
    setupDetection();
    
    // Cleanup on unmount
    return () => {
      proximityManager.onUsersUpdateCallback = null;
      if (isCameraActive) {
        cameraManager.stopFaceDetection();
        setIsCameraActive(false);
      }
    };
  }, []);
  
  // Start/stop camera detection
  const toggleCamera = async () => {
    if (isCameraActive) {
      // Stop detection
      cameraManager.stopFaceDetection();
      setIsCameraActive(false);
      setDetectedFaces([]);
    } else {
      // Start detection
      const success = cameraManager.startFaceDetection((faces) => {
        setDetectedFaces(faces);
        
        // For each face detected, check if there's a match
        faces.forEach(face => {
          if (face.userId) {
            console.log(`Detected user with ID: ${face.userId}`);
          }
        });
      });
      
      setIsCameraActive(success);
    }
  };
  
  // Take a picture to try identifying people
  const takePicture = async () => {
    try {
      // In a real app, this would capture an image and analyze it
      Alert.alert('Taking Picture', 'This would capture and analyze faces in a real app');
      
      // Simulate detection after photo by triggering a manual detection
      proximityManager.takePicture();
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };
  
  // View details of a user
  const viewUserDetails = (user: NearbyUser) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };
  
  // Create a badge for the detection method
  const getMethodBadge = (methods: ProximityMethod[]) => {
    // If camera is one of the methods, highlight it
    const isCameraDetection = methods.includes(ProximityMethod.CAMERA);
    const methodType = isCameraDetection ? 'camera' : methods[0];
    
    // Get facial data if available
    const hasFaceData = isCameraDetection && selectedUser?.faceData;
    
    return {
      label: isCameraDetection ? 'Camera' : methodType === 'nfc' ? 'NFC' : 'Location',
      color: isCameraDetection ? '#e74c3c' : methodType === 'nfc' ? '#3498db' : '#2ecc71',
      icon: isCameraDetection ? 'camera' : methodType === 'nfc' ? 'wifi' : 'map-marker-alt'
    };
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Camera Proximity</Text>
        <TouchableOpacity 
          style={[styles.cameraButton, isCameraActive && styles.cameraActive]} 
          onPress={toggleCamera}
        >
          <MaterialIcons 
            name={isCameraActive ? "camera" : "camera-alt"} 
            size={24} 
            color={isCameraActive ? "#e74c3c" : "#fff"} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Status indicator */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {isLoading ? 'Initializing...' : 
           !cameraInitialized ? 'Camera not available' :
           isCameraActive ? 'Camera active - detecting faces' : 
           'Camera ready - tap camera icon to activate'}
        </Text>
      </View>
      
      {/* Camera control buttons */}
      {cameraInitialized && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, isCameraActive && styles.activeButton]}
            onPress={toggleCamera}
          >
            <MaterialIcons 
              name={isCameraActive ? "pause" : "play-arrow"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.buttonText}>
              {isCameraActive ? "Pause Detection" : "Start Detection"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={takePicture}
          >
            <MaterialIcons name="camera" size={24} color="#fff" />
            <Text style={styles.buttonText}>Take Picture</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Detected faces overlay */}
      {isCameraActive && detectedFaces.length > 0 && (
        <View style={styles.facesOverlay}>
          <Text style={styles.facesTitle}>
            Detected Faces: {detectedFaces.length}
          </Text>
          {detectedFaces.map((face, index) => (
            <View 
              key={`face-${index}-${face.id}`}
              style={[
                styles.faceBox,
                {
                  left: face.bounds.origin.x * (width / 300), // Scaling to screen
                  top: face.bounds.origin.y * (width / 300),
                  width: face.bounds.size.width * (width / 300),
                  height: face.bounds.size.height * (width / 300),
                  borderColor: face.userId ? '#e74c3c' : '#3498db'
                }
              ]}
            >
              {face.userId && (
                <Text style={styles.faceLabel}>
                  {face.displayName || `User ${face.userId}`}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
      
      {/* Nearby users list */}
      <ScrollView style={styles.usersList}>
        <Text style={styles.sectionTitle}>
          Nearby People {nearbyUsers.length > 0 ? `(${nearbyUsers.length})` : ''}
        </Text>
        
        {nearbyUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="user-friends" size={30} color="#ccc" />
            <Text style={styles.emptyText}>
              No one nearby. Try moving around or activating the camera.
            </Text>
          </View>
        ) : (
          nearbyUsers.map((item, index) => (
            <TouchableOpacity 
              key={`user-${item.userId}-${index}`} 
              style={styles.userCard}
              onPress={() => viewUserDetails(item)}
            >
              <View style={styles.userInfo}>
                <Image 
                  source={{ uri: item.avatarUrl || `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${index % 100}.jpg` }} 
                  style={styles.avatar} 
                />
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>
                    {item.displayName}
                  </Text>
                  <Text style={styles.userHandle}>
                    @{item.username}
                  </Text>
                  
                  <View style={styles.detectionInfo}>
                    {item.methods.map((method, i) => (
                      <View key={`method-${i}`} style={[styles.methodBadge, { backgroundColor: method === ProximityMethod.CAMERA ? '#e74c3c' : method === ProximityMethod.NFC ? '#3498db' : '#2ecc71' }]}>
                        <FontAwesome5 name={method === ProximityMethod.CAMERA ? 'camera' : method === ProximityMethod.NFC ? 'wifi' : 'map-marker-alt'} size={10} color="#fff" />
                        <Text style={styles.methodText}>
                          {method === ProximityMethod.CAMERA ? 'Camera' : method === ProximityMethod.NFC ? 'NFC' : 'Location'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              
              <View style={styles.userMeta}>
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceText}>
                    {Math.round(item.confidence)}%
                  </Text>
                  <View style={styles.confidenceBars}>
                    <View 
                      style={[
                        styles.confidenceBar, 
                        { 
                          width: `${item.confidence}%`,
                          backgroundColor: item.confidence > 80 ? '#2ecc71' : item.confidence > 50 ? '#f39c12' : '#e74c3c'
                        }
                      ]} 
                    />
                  </View>
                </View>
                
                {item.distance !== undefined && (
                  <Text style={styles.distance}>
                    {item.distance < 10 ? 'Very Close' : `${Math.round(item.distance)}m away`}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      
      {/* User detail modal */}
      <Modal
        visible={showUserDetail}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUserDetail(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowUserDetail(false)}
            >
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            
            {selectedUser && (
              <View style={styles.userDetailContent}>
                <Image 
                  source={{ uri: selectedUser.avatarUrl || `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg` }} 
                  style={styles.detailAvatar} 
                />
                
                <Text style={styles.detailName}>{selectedUser.displayName}</Text>
                <Text style={styles.detailUsername}>@{selectedUser.username}</Text>
                
                <View style={styles.detailMethodsContainer}>
                  {selectedUser.methods.map((method, i) => {
                    const badge = getMethodBadge([method]);
                    return (
                      <View 
                        key={`detail-method-${i}`} 
                        style={[styles.detailMethod, { backgroundColor: badge.color }]}
                      >
                        <FontAwesome5 name={badge.icon} size={14} color="#fff" />
                        <Text style={styles.detailMethodText}>{badge.label}</Text>
                      </View>
                    );
                  })}
                </View>
                
                <View style={styles.detailConfidence}>
                  <Text style={styles.detailConfidenceText}>
                    Recognition Confidence: {Math.round(selectedUser.confidence)}%
                  </Text>
                  <View style={styles.detailConfidenceBar}>
                    <View 
                      style={[
                        styles.detailConfidenceFill,
                        {
                          width: `${selectedUser.confidence}%`,
                          backgroundColor: selectedUser.confidence > 80 ? '#2ecc71' : selectedUser.confidence > 50 ? '#f39c12' : '#e74c3c'
                        }
                      ]}
                    />
                  </View>
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setShowUserDetail(false);
                      onUserSelect(selectedUser);
                    }}
                  >
                    <MaterialIcons name="chat" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Message</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton}>
                    <MaterialIcons name="person-add" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Add Friend</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  cameraActive: {
    backgroundColor: '#e74c3c30',
  },
  statusBar: {
    padding: 8,
    backgroundColor: '#282828',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#282828',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  facesOverlay: {
    position: 'absolute',
    top: 170,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    pointerEvents: 'none',
  },
  facesTitle: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 8,
  },
  faceBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  faceLabel: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: 'rgba(231, 76, 60, 0.7)',
    padding: 2,
    borderRadius: 2,
    marginBottom: -14,
    maxWidth: 100,
    textAlign: 'center',
  },
  usersList: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
  userCard: {
    backgroundColor: '#282828',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#444',
  },
  nameContainer: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  detectionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  methodText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
  },
  userMeta: {
    marginTop: 16,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 14,
    width: 40,
  },
  confidenceBars: {
    flex: 1,
    height: 6,
    backgroundColor: '#444',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: 6,
    borderRadius: 3,
  },
  distance: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  userDetailContent: {
    alignItems: 'center',
  },
  detailAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  detailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  detailUsername: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 16,
  },
  detailMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  detailMethodText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
  detailConfidence: {
    width: '100%',
    marginVertical: 16,
  },
  detailConfidenceText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  detailConfidenceBar: {
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    overflow: 'hidden',
  },
  detailConfidenceFill: {
    height: 8,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default CameraProximityView;