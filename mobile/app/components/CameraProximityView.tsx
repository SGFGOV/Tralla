import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
// These imports would work once the packages are installed
// import { Camera, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import proximityManager, { NearbyUser } from '../utils/proximityManager';

// This component would be imported from expo-camera
const CameraView = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.camera}>
    {/* This would be a real Camera component */}
    <View style={styles.mockCamera}>
      <Text style={styles.mockCameraText}>Camera Preview</Text>
    </View>
    {children}
  </View>
);

interface Props {
  userId: number;
  onClose: () => void;
  onUserSelect?: (user: NearbyUser) => void;
}

const CameraProximityView: React.FC<Props> = ({ userId, onClose, onUserSelect }) => {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [activeCamera, setActiveCamera] = useState<'front' | 'back'>('front');
  const [isDetecting, setIsDetecting] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [flash, setFlash] = useState<'on' | 'off' | 'auto'>('off');
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [showPhoto, setShowPhoto] = useState(false);

  // Start detection when component mounts
  useEffect(() => {
    startDetection();

    // Cleanup when component unmounts
    return () => {
      stopDetection();
    };
  }, []);

  // Set up the nearby users callback
  useEffect(() => {
    proximityManager.setOnNearbyUsersChangedCallback((users) => {
      setNearbyUsers(users);
    });

    return () => {
      proximityManager.setOnNearbyUsersChangedCallback(null);
    };
  }, []);

  // Start proximity detection
  const startDetection = async () => {
    try {
      // Initialize with user ID and custom settings for camera focus
      await proximityManager.init(userId, {
        locationEnabled: true,
        nfcEnabled: true,
        cameraEnabled: true,
        cameraRadius: 15, // 15 meters equivalent in camera distance units
        refreshInterval: 5000, // 5 seconds
      });

      // Start detection
      const started = await proximityManager.startDetection();
      setIsDetecting(started);
    } catch (error) {
      console.error('Failed to start detection:', error);
      setIsDetecting(false);
    }
  };

  // Stop proximity detection
  const stopDetection = () => {
    proximityManager.cleanup();
    setIsDetecting(false);
  };

  // Toggle camera between front and back
  const toggleCameraType = () => {
    setActiveCamera((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Toggle flash mode
  const toggleFlash = () => {
    setFlash((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  // Take a picture
  const takePicture = async () => {
    try {
      const photoUri = await proximityManager.takePicture();
      if (photoUri) {
        setLastPhotoUri(photoUri);
        setShowPhoto(true);
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
    }
  };

  // Handle user selection
  const handleUserSelect = (user: NearbyUser) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
    setShowUserList(false);
  };

  // Render face detection overlays
  const renderFaceOverlays = () => {
    return nearbyUsers
      .filter(user => user.detectionMethod === 'camera' || user.detectionMethod === 'multiple')
      .filter(user => user.faceData)
      .map(user => {
        if (!user.faceData) return null;
        
        const { bounds } = user.faceData.face;
        
        return (
          <TouchableOpacity 
            key={user.id} 
            style={[
              styles.faceBox,
              {
                left: bounds.origin.x,
                top: bounds.origin.y,
                width: bounds.size.width,
                height: bounds.size.height,
              }
            ]}
            onPress={() => handleUserSelect(user)}
          >
            <View style={styles.faceInfo}>
              <Text style={styles.faceText}>{user.displayName}</Text>
              <Text style={styles.faceDetailText}>
                {Math.round((user.distance || 0) * 10) / 10}m
              </Text>
            </View>
          </TouchableOpacity>
        );
      });
  };

  // Render user list
  const renderUserList = () => {
    return (
      <Modal
        visible={showUserList}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserList(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nearby People</Text>
              <TouchableOpacity onPress={() => setShowUserList(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={nearbyUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.userItem}
                  onPress={() => handleUserSelect(item)}
                >
                  <View style={styles.userAvatar}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: getUserColor(item.id) }]}>
                        <Text style={styles.avatarText}>
                          {item.displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {item.detectionMethod === 'nfc' && (
                      <View style={styles.methodBadge}>
                        <Ionicons name="radio" size={12} color="#fff" />
                      </View>
                    )}
                    {item.detectionMethod === 'camera' && (
                      <View style={styles.methodBadge}>
                        <Ionicons name="videocam" size={12} color="#fff" />
                      </View>
                    )}
                    {item.detectionMethod === 'location' && (
                      <View style={styles.methodBadge}>
                        <Ionicons name="location" size={12} color="#fff" />
                      </View>
                    )}
                    {item.detectionMethod === 'multiple' && (
                      <View style={styles.methodBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.displayName}</Text>
                    <Text style={styles.userDetail}>
                      {item.distance ? `${Math.round(item.distance * 10) / 10}m away` : 'Nearby'}
                    </Text>
                    <View style={styles.confidenceBar}>
                      <View 
                        style={[
                          styles.confidenceFill, 
                          { width: `${item.confidence * 100}%` }
                        ]} 
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.userList}
            />
          </View>
        </View>
      </Modal>
    );
  };

  // Render photo preview
  const renderPhotoPreview = () => {
    if (!lastPhotoUri) return null;
    
    return (
      <Modal
        visible={showPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhoto(false)}
      >
        <View style={styles.photoModal}>
          <Image 
            source={{ uri: lastPhotoUri }} 
            style={styles.photoPreview}
            resizeMode="contain"
          />
          <View style={styles.photoControls}>
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={() => setShowPhoto(false)}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
              <Text style={styles.photoButtonText}>Discard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={() => {
                // In a real app, you would save the photo or use it
                setShowPhoto(false);
              }}
            >
              <Ionicons name="checkmark-circle" size={32} color="#fff" />
              <Text style={styles.photoButtonText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Generate consistent colors for user avatars
  const getUserColor = (id: number): string => {
    const colors = [
      '#FF5252', '#FF4081', '#E040FB', '#7C4DFF',
      '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
      '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41',
      '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
    ];
    
    return colors[id % colors.length];
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView>
        {/* Camera overlay with face detection */}
        <View style={styles.overlay}>
          {renderFaceOverlays()}
        </View>
        
        {/* Camera controls */}
        <View style={styles.controls}>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.topRightControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={toggleFlash}
              >
                <Ionicons 
                  name={
                    flash === 'off' ? 'flash-off' : 
                    flash === 'on' ? 'flash' : 'flash-outline'
                  } 
                  size={24} 
                  color="#fff" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, { marginLeft: 20 }]}
                onPress={() => setShowUserList(true)}
              >
                <View style={styles.badgeContainer}>
                  <Ionicons name="people" size={24} color="#fff" />
                  {nearbyUsers.length > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{nearbyUsers.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.bottomControls}>
            <View style={styles.captureContainer}>
              <TouchableOpacity 
                style={styles.flipCamera}
                onPress={toggleCameraType}
              >
                <Ionicons name="camera-reverse" size={30} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <View style={{ width: 50 }} /> {/* Spacer to balance the layout */}
            </View>
          </View>
        </View>
      </CameraView>
      
      {/* User list modal */}
      {renderUserList()}
      
      {/* Photo preview modal */}
      {renderPhotoPreview()}
    </SafeAreaView>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  mockCamera: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockCameraText: {
    color: '#fff',
    fontSize: 18,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4081',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomControls: {
    padding: 20,
    paddingBottom: 40,
  },
  captureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
  },
  flipCamera: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00E676',
    borderRadius: 2,
  },
  faceInfo: {
    position: 'absolute',
    top: -45,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 5,
    width: 100,
  },
  faceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  faceDetailText: {
    color: '#00E676',
    fontSize: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: screenHeight * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userList: {
    padding: 10,
  },
  userItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    position: 'relative',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  methodBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF4081',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  confidenceBar: {
    marginTop: 5,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    width: '100%',
  },
  confidenceFill: {
    height: 4,
    backgroundColor: '#00E676',
    borderRadius: 2,
  },
  photoModal: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: {
    width: screenWidth,
    height: screenHeight - 100,
  },
  photoControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    position: 'absolute',
    bottom: 40,
  },
  photoButton: {
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#fff',
    marginTop: 5,
  },
});

export default CameraProximityView;