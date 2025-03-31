import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DetectedFace {
  id: number;
  userId: number | null;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  publicDetails: Record<string, any>;
}

interface FaceBoxProps {
  face: DetectedFace;
  selected: boolean;
  onClick: () => void;
}

function FaceBox({ face, selected, onClick }: FaceBoxProps) {
  return (
    <div
      className={`absolute border-2 transition-all cursor-pointer ${
        selected 
          ? 'border-primary shadow-lg scale-105' 
          : 'border-green-500'
      }`}
      style={{
        left: `${face.boundingBox.x * 100}%`,
        top: `${face.boundingBox.y * 100}%`,
        width: `${face.boundingBox.width * 100}%`,
        height: `${face.boundingBox.height * 100}%`,
      }}
      onClick={onClick}
    />
  );
}

interface ProfileCardProps {
  face: DetectedFace;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

function ProfileCard({ face, onClose, onPrevious, onNext, hasNext, hasPrevious }: ProfileCardProps) {
  if (!face.userId) {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 shadow-md rounded-t-lg">
        <div className="text-center">
          <h3 className="font-semibold text-lg">Unknown Person</h3>
          <p className="text-sm text-gray-500">This person is not registered in the system.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 shadow-md rounded-t-lg">
      <div className="relative">
        <div className="flex items-center space-x-4">
          {face.avatar && (
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              <img src={face.avatar} alt={face.displayName || "User"} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{face.displayName}</h3>
            {face.username && <p className="text-gray-500 text-sm">@{face.username}</p>}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onPrevious} 
              disabled={!hasPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onNext} 
              disabled={!hasNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Public Profile Details */}
        <div className="mt-4 space-y-2">
          {Object.entries(face.publicDetails).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-sm">{value}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LiveFaceDetection() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Start webcam when component mounts
  useEffect(() => {
    startWebcam();
    return () => {
      // Clean up the stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment" 
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setErrorMessage('');
      
      // Start face detection when stream is ready
      startFaceDetection();
    } catch (error) {
      console.error('Error accessing webcam:', error);
      setErrorMessage('Could not access camera. Please ensure you have given camera permissions.');
    }
  };

  const startFaceDetection = () => {
    setIsDetecting(true);
    detectFaces();
  };

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !isDetecting) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Only send frame to API every ~500ms to prevent overwhelming the server
    if (Date.now() % 10 === 0) { // Approximately once per second
      try {
        // Capture the frame as a jpeg blob
        const frame = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else throw new Error("Failed to create image blob");
          }, 'image/jpeg', 0.7); // Reduced quality for performance
        });
        
        // Send to API for face detection
        const formData = new FormData();
        formData.append('image', frame, 'frame.jpg');
        
        const response = await apiRequest('POST', '/api/facial-recognition/identify', formData, true);
        const data = await response.json();
        
        if (data.success && data.user) {
          // Create a mock detected face for demo
          // In a real implementation, the API would return multiple detected faces with bounding boxes
          const newFace: DetectedFace = {
            id: Date.now(), // Unique ID for this detection
            userId: data.user.id,
            username: data.user.username,
            displayName: data.user.displayName,
            avatar: data.user.avatar,
            boundingBox: {
              // Mock bounding box - randomly position it for demo purposes
              x: 0.3 + (Math.random() * 0.1),
              y: 0.2 + (Math.random() * 0.1),
              width: 0.2,
              height: 0.3
            },
            publicDetails: {
              // Only include fields marked as public
              ...(data.user.bio && { bio: data.user.bio }),
              ...(data.user.interests && { interests: data.user.interests.join(', ') }),
            }
          };
          
          // Add the new face if it's not already detected (based on userId)
          setDetectedFaces(prev => {
            // Don't add if user already detected
            if (prev.some(face => face.userId === newFace.userId)) return prev;
            return [...prev, newFace];
          });
        }
      } catch (error) {
        console.error('Error detecting faces:', error);
      }
    }
    
    // Continue detection loop
    animationRef.current = requestAnimationFrame(detectFaces);
  };

  const handleFaceClick = (index: number) => {
    setSelectedFaceIndex(index);
  };

  const handleCloseProfile = () => {
    setSelectedFaceIndex(null);
  };

  const handlePreviousFace = () => {
    if (selectedFaceIndex === null || selectedFaceIndex <= 0) return;
    setSelectedFaceIndex(selectedFaceIndex - 1);
  };

  const handleNextFace = () => {
    if (selectedFaceIndex === null || selectedFaceIndex >= detectedFaces.length - 1) return;
    setSelectedFaceIndex(selectedFaceIndex + 1);
  };

  // Add touch gesture handlers for swiping between detected faces
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;
    
    const handleTouchStart = (event: TouchEvent) => {
      touchStartX = event.touches[0].clientX;
    };
    
    const handleTouchMove = (event: TouchEvent) => {
      touchEndX = event.touches[0].clientX;
    };
    
    const handleTouchEnd = () => {
      const minSwipeDistance = 50;
      const swipeDistance = touchEndX - touchStartX;
      
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          // Swipe right - go to previous face
          handlePreviousFace();
        } else {
          // Swipe left - go to next face
          handleNextFace();
        }
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [selectedFaceIndex, detectedFaces.length]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black flex flex-col">
      {errorMessage && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-destructive/10 text-destructive p-3 text-sm">
          {errorMessage}
        </div>
      )}
      
      <div className="relative flex-1 w-full">
        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Video stream */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Face detection boxes overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {detectedFaces.map((face, index) => (
            <FaceBox 
              key={face.id} 
              face={face} 
              selected={selectedFaceIndex === index}
              onClick={() => handleFaceClick(index)}
            />
          ))}
        </div>
        
        {/* Selected profile card */}
        {selectedFaceIndex !== null && (
          <ProfileCard 
            face={detectedFaces[selectedFaceIndex]}
            onClose={handleCloseProfile}
            onPrevious={handlePreviousFace}
            onNext={handleNextFace}
            hasPrevious={selectedFaceIndex > 0}
            hasNext={selectedFaceIndex < detectedFaces.length - 1}
          />
        )}
      </div>
      
      <div className="p-2 bg-gray-100 text-center text-sm text-gray-500">
        Point camera at faces to identify people nearby. Tap on green boxes for more info.
      </div>
    </div>
  );
}