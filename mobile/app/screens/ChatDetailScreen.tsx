import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Message type definition
interface Message {
  id: number;
  text: string;
  sentBy: 'user' | 'other';
  timestamp: Date;
}

// Mock data for demo purposes - would come from API in production
const MOCK_MESSAGES: Message[] = [
  {
    id: 1,
    text: "Hey there! I noticed you're nearby.",
    sentBy: 'other',
    timestamp: new Date(Date.now() - 60000 * 45)
  },
  {
    id: 2,
    text: "Hi! Yes, I'm at the coffee shop. Are you around here too?",
    sentBy: 'user',
    timestamp: new Date(Date.now() - 60000 * 40)
  },
  {
    id: 3,
    text: "Yeah, I'm just across the street at the bookstore. Want to meet up?",
    sentBy: 'other',
    timestamp: new Date(Date.now() - 60000 * 30)
  },
  {
    id: 4,
    text: "That sounds great! I can head over in about 10 minutes. I'm finishing up some work.",
    sentBy: 'user',
    timestamp: new Date(Date.now() - 60000 * 25)
  },
  {
    id: 5,
    text: "Perfect! I'll be browsing the fiction section. Just look for someone in a blue jacket.",
    sentBy: 'other',
    timestamp: new Date(Date.now() - 60000 * 15)
  },
  {
    id: 6,
    text: "I'll be there soon!",
    sentBy: 'user',
    timestamp: new Date(Date.now() - 60000 * 10)
  },
];

export default function ChatDetailScreen({ route, navigation }: any) {
  const { id, name } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Mock function to fetch messages
  const fetchMessages = async () => {
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data for demonstration
      setMessages(MOCK_MESSAGES);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchMessages();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Send message handler
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const message: Message = {
      id: messages.length + 1,
      text: newMessage,
      sentBy: 'user',
      timestamp: new Date(),
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    // Today
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return `${hours}:${formattedMinutes}`;
    }
    
    // Yesterday
    if (diff < 48 * 60 * 60 * 1000 && date.getDate() === now.getDate() - 1) {
      return `Yesterday ${hours}:${formattedMinutes}`;
    }
    
    // Show date
    return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${formattedMinutes}`;
  };

  // Render message item
  const renderMessageItem = ({ item }: { item: Message }) => (
    <View 
      style={[
        styles.messageContainer,
        item.sentBy === 'user' ? styles.sentMessage : styles.receivedMessage
      ]}
    >
      <View 
        style={[
          styles.messageBubble,
          item.sentBy === 'user' ? styles.sentBubble : styles.receivedBubble
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
      <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#6366f1" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{name}</Text>
          <Text style={styles.headerStatus}>Online now</Text>
        </View>
        
        <TouchableOpacity style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={28} color="#6366f1" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle-outline" size={24} color="#6366f1" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              multiline
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                newMessage.trim() === '' && styles.disabledSendButton
              ]}
              onPress={handleSendMessage}
              disabled={newMessage.trim() === ''}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={newMessage.trim() === '' ? "#9ca3af" : "#ffffff"} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerStatus: {
    fontSize: 12,
    color: '#4ade80',
  },
  infoButton: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  sentBubble: {
    backgroundColor: '#6366f1',
    borderTopRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: 'white',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  attachButton: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    color: '#1f2937',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#6366f1',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#e5e7eb',
  },
});