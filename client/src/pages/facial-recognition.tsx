import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FacialRecognition() {
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRegister = async () => {
    if (!selectedFile || !userId) {
      toast({
        title: "Missing information",
        description: "Please select an image and enter a user ID.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('userId', userId.toString());

    try {
      const response = await apiRequest('POST', '/api/facial-recognition/register', formData, true);
      
      const data = await response.json();
      setResult(data);
      toast({
        title: data.success ? "Success" : "Error", 
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to register face. Server error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdentify = async () => {
    if (!selectedFile) {
      toast({
        title: "Missing image",
        description: "Please select an image to identify.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await apiRequest('POST', '/api/facial-recognition/identify', formData, true);
      const data = await response.json();
      
      setResult(data);
      if (data.success) {
        toast({
          title: "Person identified",
          description: `Identified as ${data.user.displayName} (ID: ${data.user.id})`,
        });
      } else {
        toast({
          title: "Not identified",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to identify face. Server error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({
        title: "Missing image",
        description: "Please select an image to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await apiRequest('POST', '/api/facial-recognition/analyze', formData, true);
      const data = await response.json();
      
      setResult(data);
      if (data.success) {
        toast({
          title: "Analysis complete",
          description: "Face features extracted successfully.",
        });
      } else {
        toast({
          title: "Analysis failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to analyze face. Server error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
        Facial Recognition System
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Image Upload</CardTitle>
            <CardDescription>Select an image containing a face to process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              
              {previewUrl && (
                <div className="mt-4 relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-auto rounded-md border border-gray-300"
                  />
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="absolute top-2 right-2 opacity-80"
                    onClick={clearImage}
                  >
                    Clear
                  </Button>
                </div>
              )}
              
              {!previewUrl && (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-md border border-dashed border-gray-300">
                  <p className="text-gray-500">No image selected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Process the uploaded face image</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="register">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="identify">Identify</TabsTrigger>
                <TabsTrigger value="analyze">Analyze</TabsTrigger>
              </TabsList>
              
              <TabsContent value="register">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="userId" className="block text-sm font-medium mb-1">
                      User ID
                    </label>
                    <Input 
                      id="userId" 
                      type="number" 
                      value={userId || ''} 
                      onChange={(e) => setUserId(parseInt(e.target.value) || null)} 
                      placeholder="Enter user ID"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleRegister} 
                    disabled={isLoading || !selectedFile || !userId}
                    className="w-full"
                  >
                    {isLoading ? 'Processing...' : 'Register Face'}
                  </Button>
                  
                  <p className="text-sm text-gray-600">
                    Register this face to the specified user ID in the system.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="identify">
                <div className="space-y-3">
                  <Button 
                    onClick={handleIdentify} 
                    disabled={isLoading || !selectedFile}
                    className="w-full"
                  >
                    {isLoading ? 'Processing...' : 'Identify Person'}
                  </Button>
                  
                  <p className="text-sm text-gray-600">
                    Identify the person in this image by comparing with registered faces.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="analyze">
                <div className="space-y-3">
                  <Button 
                    onClick={handleAnalyze} 
                    disabled={isLoading || !selectedFile}
                    className="w-full"
                  >
                    {isLoading ? 'Processing...' : 'Analyze Face'}
                  </Button>
                  
                  <p className="text-sm text-gray-600">
                    Extract facial features and analyze the face in the image.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>Processing result from the server</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
              <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}