import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  LinearProgress,
  Slider,
  Paper,
  Tooltip,
  Badge,
  Fab,
  Collapse,
  Alert
} from '@mui/material';
import {
  Mic,
  MicOff,
  PlayArrow,
  Pause,
  Stop,
  Send,
  Delete,
  VolumeUp,
  VolumeOff,
  Replay,
  FastForward,
  FastRewind,
  Close,
  PersonAdd,
  Reply,
  Share,
  Favorite,
  FavoriteBorder,
  Schedule,
  Check,
  Error,
  CloudUpload,
  Waveform
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Voice messaging colors
const colors = {
  recording: '#F44336',
  playing: '#2196F3',
  sent: '#4CAF50',
  received: '#FF9800',
  background: 'linear-gradient(135deg, #FF6B9D, #4ECDC4)'
};

// Audio visualization component
const AudioWaveform = ({ isRecording, isPlaying, audioData = [], width = 200, height = 60 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (isRecording || isPlaying) {
        const bars = 20;
        const barWidth = width / bars;

        for (let i = 0; i < bars; i++) {
          const barHeight = isRecording
            ? Math.random() * height * 0.8 + height * 0.1
            : (audioData[i] || 0) * height * 0.8 + height * 0.1;

          ctx.fillStyle = isRecording ? colors.recording : colors.playing;
          ctx.fillRect(i * barWidth, (height - barHeight) / 2, barWidth - 2, barHeight);
        }
      } else {
        // Static waveform
        const bars = 20;
        const barWidth = width / bars;

        for (let i = 0; i < bars; i++) {
          const barHeight = Math.sin(i * 0.5) * 20 + 25;
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(i * barWidth, (height - barHeight) / 2, barWidth - 2, barHeight);
        }
      }

      if (isRecording || isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isPlaying, audioData, width, height]);

  return <canvas ref={canvasRef} style={{ borderRadius: '8px' }} />;
};

// Voice message item component
const VoiceMessageItem = ({ message, isOwn = false, onPlay, onReply, onFavorite }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(message.duration || 30);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (onPlay) onPlay(message.id, !isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ x: isOwn ? 50 : -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ marginBottom: '16px' }}
    >
      <Box sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: 1
      }}>
        {!isOwn && (
          <Avatar
            src={message.sender.avatar}
            sx={{ width: 32, height: 32 }}
          >
            {message.sender.name?.[0]}
          </Avatar>
        )}

        <Card sx={{
          maxWidth: '280px',
          background: isOwn
            ? 'linear-gradient(135deg, #4ECDC4, #44A08D)'
            : 'rgba(255, 255, 255, 0.95)',
          color: isOwn ? 'white' : 'inherit',
          borderRadius: '20px',
          border: isOwn ? 'none' : '1px solid rgba(0,0,0,0.1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <CardContent sx={{ p: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {isOwn ? 'You' : message.sender.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {message.timestamp}
                </Typography>
                {message.status && (
                  <Tooltip title={message.status}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {message.status === 'sent' && <Check sx={{ fontSize: 12, opacity: 0.8 }} />}
                      {message.status === 'delivered' && (
                        <Box sx={{ display: 'flex' }}>
                          <Check sx={{ fontSize: 12, opacity: 0.8 }} />
                          <Check sx={{ fontSize: 12, opacity: 0.8, ml: -0.5 }} />
                        </Box>
                      )}
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Waveform and controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <IconButton
                  onClick={handlePlay}
                  sx={{
                    bgcolor: isOwn ? 'rgba(255,255,255,0.2)' : colors.playing,
                    color: isOwn ? 'white' : 'white',
                    '&:hover': {
                      bgcolor: isOwn ? 'rgba(255,255,255,0.3)' : '#1976D2'
                    }
                  }}
                  size="small"
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </motion.div>

              <Box sx={{ flex: 1 }}>
                <AudioWaveform
                  isPlaying={isPlaying}
                  width={160}
                  height={30}
                />
              </Box>

              <Typography variant="caption" sx={{ opacity: 0.8, minWidth: 35 }}>
                {formatTime(isPlaying ? currentTime : duration)}
              </Typography>
            </Box>

            {/* Progress bar */}
            <LinearProgress
              variant="determinate"
              value={isPlaying ? (currentTime / duration) * 100 : 0}
              sx={{
                height: 2,
                borderRadius: 1,
                bgcolor: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: isOwn ? 'white' : colors.playing,
                  borderRadius: 1
                }
              }}
            />

            {/* Text transcription if available */}
            {message.transcription && (
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  p: 1,
                  bgcolor: isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 1,
                  fontSize: '0.8rem',
                  fontStyle: 'italic',
                  opacity: 0.9
                }}
              >
                "{message.transcription}"
              </Typography>
            )}

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {!isOwn && (
                  <>
                    <Tooltip title="Reply">
                      <IconButton
                        size="small"
                        onClick={() => onReply(message)}
                        sx={{ color: isOwn ? 'white' : 'text.secondary', opacity: 0.8 }}
                      >
                        <Reply fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={message.isFavorited ? "Remove from favorites" : "Add to favorites"}>
                      <IconButton
                        size="small"
                        onClick={() => onFavorite(message)}
                        sx={{ color: message.isFavorited ? colors.recording : (isOwn ? 'white' : 'text.secondary'), opacity: 0.8 }}
                      >
                        {message.isFavorited ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>

              {/* Quality indicator */}
              <Chip
                label={message.quality || 'HD'}
                size="small"
                sx={{
                  height: 16,
                  fontSize: '0.6rem',
                  bgcolor: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  color: isOwn ? 'white' : 'text.secondary',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {isOwn && (
          <Avatar sx={{ width: 32, height: 32, bgcolor: colors.playing }}>
            You
          </Avatar>
        )}
      </Box>
    </motion.div>
  );
};

// Voice recorder component
const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingError, setRecordingError] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingError('');

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      setRecordingError('Microphone access denied. Please allow microphone permissions.');
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend({
        audioBlob,
        duration: recordingTime,
        timestamp: new Date().toISOString()
      });
      setAudioBlob(null);
      setRecordingTime(0);
    }
  };

  const handleCancel = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (onCancel) onCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card sx={{
      background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.1), rgba(78, 205, 196, 0.1))',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      p: 2
    }}>
      <CardContent>
        {recordingError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {recordingError}
          </Alert>
        )}

        {/* Recording visualization */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <motion.div
            animate={{
              scale: isRecording ? [1, 1.1, 1] : 1,
              opacity: isRecording ? [1, 0.7, 1] : 1
            }}
            transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
          >
            <Box sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: isRecording ? colors.recording : 'rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 2,
              position: 'relative'
            }}>
              <Mic sx={{ fontSize: 48, color: isRecording ? 'white' : 'rgba(0,0,0,0.3)' }} />

              {isRecording && (
                <motion.div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: `3px solid ${colors.recording}`,
                  }}
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </Box>
          </motion.div>

          <Typography variant="h6" sx={{ color: isRecording ? colors.recording : 'text.secondary' }}>
            {isRecording ? 'Recording...' : audioBlob ? 'Recording Complete' : 'Ready to Record'}
          </Typography>

          <Typography variant="h4" sx={{ color: colors.recording, fontWeight: 'bold', mt: 1 }}>
            {formatTime(recordingTime)}
          </Typography>
        </Box>

        {/* Waveform visualization */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <AudioWaveform
            isRecording={isRecording}
            isPlaying={isPlaying}
            width={280}
            height={60}
          />
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          {!audioBlob ? (
            <>
              <motion.div whileTap={{ scale: 0.9 }}>
                <IconButton
                  onClick={handleCancel}
                  sx={{ color: 'text.secondary' }}
                  disabled={!isRecording}
                >
                  <Close />
                </IconButton>
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <Fab
                  onClick={isRecording ? stopRecording : startRecording}
                  sx={{
                    width: 80,
                    height: 80,
                    background: isRecording ? colors.recording : colors.playing,
                    color: 'white',
                    '&:hover': {
                      background: isRecording ? '#D32F2F' : '#1976D2'
                    }
                  }}
                >
                  {isRecording ? <Stop sx={{ fontSize: 32 }} /> : <Mic sx={{ fontSize: 32 }} />}
                </Fab>
              </motion.div>

              <Box sx={{ width: 48 }} /> {/* Spacer */}
            </>
          ) : (
            <>
              <motion.div whileTap={{ scale: 0.9 }}>
                <IconButton
                  onClick={handleCancel}
                  sx={{ color: 'text.secondary' }}
                >
                  <Delete />
                </IconButton>
              </motion.div>

              <motion.div whileTap={{ scale: 0.9 }}>
                <IconButton
                  onClick={playRecording}
                  sx={{
                    bgcolor: colors.playing,
                    color: 'white',
                    '&:hover': { bgcolor: '#1976D2' }
                  }}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <Fab
                  onClick={handleSend}
                  sx={{
                    background: colors.sent,
                    color: 'white',
                    '&:hover': { background: '#388E3C' }
                  }}
                >
                  <Send />
                </Fab>
              </motion.div>
            </>
          )}
        </Box>

        {/* Quick tips */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {!audioBlob && !isRecording && '🎤 Tap the microphone to start recording'}
            {isRecording && '⏱️ Tap stop when you\'re finished'}
            {audioBlob && '✨ Play to review, then send your message'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const VoiceMessaging = ({ child }) => {
  const [messages, setMessages] = useState([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // Sample voice messages
  useEffect(() => {
    const sampleMessages = [
      {
        id: 1,
        sender: {
          name: 'Ms. Sarah',
          avatar: '/teacher-avatar.jpg',
          role: 'teacher'
        },
        duration: 25,
        timestamp: '10:30 AM',
        transcription: 'Emma had such a wonderful time during art class today. She was so creative with her painting and helped other children too.',
        status: 'delivered',
        quality: 'HD',
        isFavorited: false
      },
      {
        id: 2,
        sender: {
          name: 'You',
          role: 'parent'
        },
        duration: 15,
        timestamp: '11:45 AM',
        transcription: 'Thank you for the update! Could you please let me know about her nap time today?',
        status: 'delivered',
        quality: 'HD',
        isOwn: true
      },
      {
        id: 3,
        sender: {
          name: 'Ms. Jenny',
          avatar: '/teacher2-avatar.jpg',
          role: 'teacher'
        },
        duration: 18,
        timestamp: '2:15 PM',
        transcription: 'Emma ate all her lunch today and even asked for seconds! She\'s developing such healthy eating habits.',
        status: 'delivered',
        quality: 'HD',
        isFavorited: true
      }
    ];

    setMessages(sampleMessages);
  }, []);

  const handleSendVoiceMessage = (voiceData) => {
    const newMessage = {
      id: messages.length + 1,
      sender: {
        name: 'You',
        role: 'parent'
      },
      duration: voiceData.duration,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      audioBlob: voiceData.audioBlob,
      status: 'sent',
      quality: 'HD',
      isOwn: true
    };

    setMessages(prev => [...prev, newMessage]);
    setShowRecorder(false);

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
        )
      );
    }, 1000);
  };

  const handlePlay = (messageId, isPlaying) => {
    // Handle voice message playback
  };

  const handleReply = (message) => {
    setShowRecorder(true);
    setSelectedContact(message.sender);
  };

  const handleFavorite = (message) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === message.id ? { ...msg, isFavorited: !msg.isFavorited } : msg
      )
    );
  };

  return (
    <Box sx={{ p: 2, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <span style={{ fontSize: '24px' }}>🎤</span>
            Voice Messages
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Send voice messages to {child?.name}'s teachers
          </Typography>

          {/* Quick stats */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${messages.length} messages`}
              size="small"
              variant="outlined"
              sx={{ borderRadius: '12px' }}
            />
            <Chip
              label={`${messages.filter(m => m.isFavorited).length} favorites`}
              size="small"
              variant="outlined"
              color="error"
              sx={{ borderRadius: '12px' }}
            />
          </Box>
        </Box>
      </motion.div>

      {/* Messages list */}
      <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
        <AnimatePresence>
          {messages.map((message) => (
            <VoiceMessageItem
              key={message.id}
              message={message}
              isOwn={message.isOwn}
              onPlay={handlePlay}
              onReply={handleReply}
              onFavorite={handleFavorite}
            />
          ))}
        </AnimatePresence>

        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 193, 7, 0.1))',
              border: '2px dashed rgba(0,0,0,0.1)'
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontSize: '48px' }}>
                🎤
              </Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Start Your First Voice Chat!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Send voice messages to stay connected with your child's teachers
              </Typography>
              <Button
                variant="contained"
                startIcon={<Mic />}
                onClick={() => setShowRecorder(true)}
                sx={{
                  background: colors.recording,
                  borderRadius: '20px',
                  '&:hover': { background: '#D32F2F' }
                }}
              >
                Record Message
              </Button>
            </Paper>
          </motion.div>
        )}
      </Box>

      {/* Voice recorder */}
      <Collapse in={showRecorder}>
        <Box sx={{ mt: 2 }}>
          <VoiceRecorder
            onSend={handleSendVoiceMessage}
            onCancel={() => setShowRecorder(false)}
          />
        </Box>
      </Collapse>

      {/* Floating record button */}
      {!showRecorder && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            zIndex: 1000
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Fab
            onClick={() => setShowRecorder(true)}
            sx={{
              background: colors.recording,
              color: 'white',
              '&:hover': { background: '#D32F2F' }
            }}
          >
            <Mic />
          </Fab>
        </motion.div>
      )}
    </Box>
  );
};

export default VoiceMessaging;