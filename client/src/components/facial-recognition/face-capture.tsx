import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../contexts/auth-context";

// US Visa Photo Specifications
const VISA_PHOTO_SPECS = {
  minWidth: 600, // pixels
  minHeight: 600, // pixels
  aspectRatio: 1, // square
  eyeLineHeight: 0.55, // percentage from top
  faceHeight: 0.7, // percentage of total height
  backgroundColor: "#FFFFFF", // white background
};

interface FaceCaptureProps {
  onSuccess?: () => void;
}

export default function FaceCapture({ onSuccess }: FaceCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoTaken, setPhotoTaken] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [guidelinesMet, setGuidelinesMet] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Start webcam when component mounts
  useEffect(() => {
    startWebcam();
    return () => {
      // Clean up the stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setPhotoTaken(false);
      setErrorMessage('');
    } catch (error) {
      console.error('Error accessing webcam:', error);
      setErrorMessage('Could not access webcam. Please ensure you have given camera permissions.');
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to be square (aspect ratio 1:1)
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    
    // Calculate the cropping position to center the face
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    
    // Draw the video frame onto the canvas, cropping to a square
    context.drawImage(
      video, 
      offsetX, offsetY, size, size, // Source coordinates
      0, 0, size, size              // Destination coordinates
    );
    
    setPhotoTaken(true);
    
    // Verify the photo meets US Visa specifications
    verifyPhotoMeetsSpecifications();
  };

  const verifyPhotoMeetsSpecifications = async () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    
    // Check dimensions
    if (canvas.width < VISA_PHOTO_SPECS.minWidth || canvas.height < VISA_PHOTO_SPECS.minHeight) {
      setGuidelinesMet(false);
      toast({
        title: "Photo doesn't meet specifications",
        description: "The image resolution is too low. Please try again in better lighting.",
        variant: "destructive",
      });
      return;
    }
    
    // For a real implementation, we would perform face detection to verify:
    // 1. A face is present and properly centered
    // 2. Eyes are at the proper height
    // 3. Face takes up the correct proportion of the image
    // 4. Background is plain and light-colored
    
    // For now, we'll just analyze the image using our facial recognition API
    try {
      const photoBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else throw new Error("Failed to create image blob");
        }, 'image/jpeg', 0.95);
      });
      
      const formData = new FormData();
      formData.append('image', photoBlob, 'face-capture.jpg');
      
      const response = await apiRequest('POST', '/api/facial-recognition/analyze', formData, true);
      const data = await response.json();
      
      if (data.success) {
        setGuidelinesMet(true);
        toast({
          title: "Photo is valid",
          description: "Your photo meets the requirements. You can now upload it.",
        });
      } else {
        setGuidelinesMet(false);
        toast({
          title: "Photo validation failed",
          description: data.message || "Please ensure your face is clearly visible and centered.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error analyzing face:', error);
      setGuidelinesMet(false);
      toast({
        title: "Photo validation error",
        description: "Could not validate the photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const uploadPhoto = async () => {
    if (!canvasRef.current || !user?.id) return;
    
    try {
      setIsUploading(true);
      
      const photoBlob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((blob) => {
          if (blob) resolve(blob);
          else throw new Error("Failed to create image blob");
        }, 'image/jpeg', 0.95);
      });
      
      const formData = new FormData();
      formData.append('image', photoBlob, 'face-upload.jpg');
      formData.append('userId', user.id.toString());
      
      const response = await apiRequest('POST', '/api/facial-recognition/register', formData, true);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Face registered successfully",
          description: "Your facial profile has been saved.",
        });
        
        // If avatar field exists, update it with the captured image
        const imageUrl = URL.createObjectURL(photoBlob);
        
        // Update user's avatar
        await apiRequest('PATCH', `/api/users/${user.id}`, {
          avatar: imageUrl
        });
        
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Registration failed",
          description: data.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const retakePhoto = () => {
    setPhotoTaken(false);
    setGuidelinesMet(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {errorMessage && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
        
        <div className="relative aspect-square bg-black rounded-md overflow-hidden">
          {!photoTaken ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              
              {/* Face positioning guide overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="relative h-full w-full">
                  {/* Face oval guide */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-4/5 border-2 border-primary rounded-full opacity-50" />
                  
                  {/* Eye level guide line */}
                  <div className="absolute left-0 right-0 top-[55%] border-t border-dashed border-primary opacity-50" />
                  
                  {/* Instructions overlay */}
                  <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs bg-black/50 p-1">
                    Center your face in the oval and look directly at the camera
                  </div>
                </div>
              </div>
            </>
          ) : (
            <canvas 
              ref={canvasRef} 
              className="w-full h-full object-contain"
            />
          )}
        </div>
        
        <div className="flex justify-between gap-2">
          {!photoTaken ? (
            <Button 
              onClick={takePhoto} 
              className="w-full"
              disabled={!stream}
            >
              Capture Photo
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={retakePhoto} 
                disabled={isUploading}
                className="flex-1"
              >
                Take Again
              </Button>
              
              <Button 
                onClick={uploadPhoto} 
                disabled={isUploading || !guidelinesMet}
                className="flex-1"
              >
                {isUploading ? "Uploading..." : "Save Photo"}
              </Button>
            </>
          )}
        </div>
        
        <div className="text-xs text-neutral-500 space-y-1 mt-2">
          <p>Photo Requirements:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>Face clearly visible and centered</li>
            <li>Neutral facial expression</li>
            <li>Plain, light-colored background</li>
            <li>No glasses or head coverings</li>
            <li>Good lighting on your face</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}