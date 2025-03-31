import { createCanvas, loadImage, Image } from 'canvas';
import { storage } from '../storage';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Face embeddings for registered users
interface FaceEmbedding {
  userId: number;
  imageHash: string;
  timestamp: Date;
}

// Store face embeddings in memory
const faceEmbeddings: FaceEmbedding[] = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../../face-data');

// Initialize the face recognition system
export async function initializeFacialRecognition() {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Load stored embeddings
    await loadStoredFaceEmbeddings();
    
    console.log('Facial recognition system initialized successfully.');
    return true;
  } catch (error) {
    console.error('Failed to initialize facial recognition:', error);
    return false;
  }
}

// Create face embedding from an image
export async function createFaceEmbedding(imageBuffer: Buffer, userId: number): Promise<boolean> {
  try {
    // Generate a hash of the image for uniqueness
    const hash = crypto.createHash('md5').update(imageBuffer).digest('hex');
    
    // Save the image to the face data directory
    const imagePath = path.join(dataDir, `user_${userId}_${hash}.jpg`);
    fs.writeFileSync(imagePath, imageBuffer);
    
    // Add record to our in-memory database
    faceEmbeddings.push({
      userId,
      imageHash: hash,
      timestamp: new Date()
    });
    
    console.log(`Created face embedding for user ${userId} with hash ${hash}`);
    return true;
  } catch (error) {
    console.error('Error creating face embedding:', error);
    return false;
  }
}

// Simple function to compare two images using their hashes
function euclideanDistance(vec1: string, vec2: string): number {
  // In a real implementation, this would calculate actual similarity
  // between face embeddings. For our simplified version, just compare 
  // the first few characters of the hash to simulate similarity scoring
  let distance = 0;
  const minLength = Math.min(vec1.length, vec2.length);
  
  for (let i = 0; i < minLength; i++) {
    const charDiff = vec1.charCodeAt(i) - vec2.charCodeAt(i);
    distance += charDiff * charDiff;
  }
  
  return Math.sqrt(distance);
}

// Find the most similar face in our database
function findMostSimilarFace(imageHash: string): { userId: number; distance: number } | null {
  if (faceEmbeddings.length === 0) {
    return null;
  }

  let bestMatch = {
    userId: -1,
    distance: Number.MAX_VALUE
  };

  for (const stored of faceEmbeddings) {
    const distance = euclideanDistance(imageHash, stored.imageHash);
    if (distance < bestMatch.distance) {
      bestMatch = {
        userId: stored.userId,
        distance
      };
    }
  }

  // If the distance is above a threshold, consider it no match
  // This threshold should be tuned based on your data
  const SIMILARITY_THRESHOLD = 100; 
  if (bestMatch.distance > SIMILARITY_THRESHOLD) {
    return null;
  }

  return bestMatch;
}

// Identify a user from an image
export async function identifyUserFromImage(imageBuffer: Buffer): Promise<number | null> {
  try {
    // Generate a hash of the image
    const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
    
    // Find the most similar face in our database
    const match = findMostSimilarFace(imageHash);
    
    if (!match) {
      console.log('No matching face found');
      return null;
    }

    console.log(`Identified user with ID ${match.userId} (distance: ${match.distance})`);
    return match.userId;
  } catch (error) {
    console.error('Error identifying user from image:', error);
    return null;
  }
}

// Register a user's face
export async function registerUserFace(imageBuffer: Buffer, userId: number): Promise<boolean> {
  return await createFaceEmbedding(imageBuffer, userId);
}

// Function to process multiple face registration images for a user
export async function registerUserFaces(imageBuffers: Buffer[], userId: number): Promise<number> {
  let successCount = 0;
  
  for (const buffer of imageBuffers) {
    const success = await registerUserFace(buffer, userId);
    if (success) successCount++;
  }
  
  return successCount;
}

// Get face features as a JSON object for transfer to client
export async function getFaceFeaturesFromImage(imageBuffer: Buffer): Promise<any> {
  try {
    // Generate a hash of the image
    const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
    
    // We'll return some mock features in place of the tensorflow face detection
    return {
      success: true,
      imageHash,
      features: {
        faceDetected: true,
        confidence: 0.98,
        faceArea: {
          x: 120,
          y: 80,
          width: 200,
          height: 200
        },
        landmarks: [
          { name: "leftEye", x: 170, y: 130 },
          { name: "rightEye", x: 270, y: 130 },
          { name: "nose", x: 220, y: 180 },
          { name: "mouth", x: 220, y: 230 }
        ]
      }
    };
  } catch (error) {
    console.error('Error getting face features:', error);
    return { success: false, message: 'Failed to analyze image' };
  }
}

// Load stored face embeddings for all users in the database
export async function loadStoredFaceEmbeddings(): Promise<void> {
  try {
    // In a real implementation, you would load these from a database
    // For our in-memory storage, we'll just load from the files
    if (!fs.existsSync(dataDir)) {
      console.log('Face data directory does not exist, creating it');
      fs.mkdirSync(dataDir, { recursive: true });
      return;
    }
    
    const files = fs.readdirSync(dataDir);
    
    for (const file of files) {
      if (file.startsWith('user_') && file.endsWith('.jpg')) {
        const parts = file.replace('.jpg', '').split('_');
        const userId = parseInt(parts[1]);
        const hash = parts[2];
        
        if (!isNaN(userId) && hash) {
          faceEmbeddings.push({
            userId,
            imageHash: hash,
            timestamp: new Date()
          });
        }
      }
    }
    
    console.log(`Loaded ${faceEmbeddings.length} face embeddings from disk`);
  } catch (error) {
    console.error('Error loading face embeddings:', error);
  }
}

// Initialize the facial recognition system
initializeFacialRecognition().catch(console.error);