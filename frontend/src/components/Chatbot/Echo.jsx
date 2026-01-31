import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Fab,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../services/api';

const Echo = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm Echo, your assistant. How can I help you today?",
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await api.post('/chatbot/echo', { message: input });
      const botMessage = {
        text: response.data.response,
        sender: 'bot',
        goToPath: response.data.go_to_path ?? null,
        goToLabel: response.data.go_to_label ?? null,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot'
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!open && (
        <Fab
          aria-label="chat"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            bgcolor: 'background.paper',
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'grey.300',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            '&:hover': {
              bgcolor: 'grey.50',
              color: 'primary.main',
              borderColor: 'primary.main',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            },
          }}
          onClick={() => setOpen(true)}
        >
          <ChatIcon />
        </Fab>
      )}

      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 400,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            '@media (max-width: 600px)': {
              width: 'calc(100% - 48px)',
              height: 'calc(100% - 48px)',
              bottom: 24,
              right: 24,
              left: 24
            }
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(90deg, rgba(230,81,0,0.12) 0%, rgba(198,40,40,0.08) 100%)',
            }}
          >
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, opacity: 0.95 }}>Echo Assistant</Typography>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '70%'
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    bgcolor: msg.sender === 'user' ? 'primary.main' : 'grey.200',
                    color: msg.sender === 'user' ? 'white' : 'text.primary'
                  }}
                >
                  <Typography variant="body2">{msg.text}</Typography>
                  {msg.sender === 'bot' && msg.goToPath && msg.goToLabel && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <Link
                        component={RouterLink}
                        to={msg.goToPath}
                        underline="hover"
                        sx={{
                          color: msg.sender === 'user' ? 'inherit' : 'primary.main',
                          fontWeight: 600,
                        }}
                      >
                        Go to {msg.goToLabel}
                      </Link>
                    </Typography>
                  )}
                </Paper>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              gap: 1
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <IconButton color="primary" onClick={handleSend}>
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default Echo;
