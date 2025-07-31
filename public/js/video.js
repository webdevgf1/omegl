// Video Chat with Real WebRTC (Based on Ajnabee)

const $ = (x) => document.querySelector(x);
const esc = (x) => {
    const txt = document.createTextNode(x);
    const p = document.createElement('p');
    p.appendChild(txt);
    return p.innerHTML;
};

// WebSocket URL - adjust this to your backend
const WEBSOCKET_URL = window.location.protocol === 'https:' 
    ? `wss://${window.location.host}` 
    : `ws://${window.location.host}`;

// Global variables
let ws = null;
let pc = null;
let localStream = null;
let isConnected = false;
let isMuted = false;
let isVideoOff = false;

const debounceTime = 1000;
let timeout = null;

// DOM elements
const $msgs = $('#messages');
const $msgArea = $('.chat-messages');
const $typing = $('#typing');
const $videoPeer = $('#video-peer');
const $videoSelf = $('#video-self');
const $loader = $('#peer-video-loader');
const $messageInput = $('#message-input');
const $sendBtn = $('#send-btn');

// WebSocket initialization (like Ajnabee)
function createWebSocket() {
    return new Promise((resolve) => {
        try {
            ws = new WebSocket(WEBSOCKET_URL);
            
            ws.onopen = () => {
                console.log('WebSocket connected');
                initWebSocket();
                resolve(ws);
            };
            
            ws.onerror = (error) => {
                console.log('WebSocket error, using demo mode');
                resolve(null); // Continue with demo mode
            };
            
        } catch (error) {
            console.log('WebSocket connection failed, using demo mode');
            resolve(null); // Continue with demo mode
        }
    });
}

// WebSocket handlers (same as Ajnabee)
function initWebSocket() {
    if (!ws) return;
    
    ws.onmessage = (message) => {
        try {
            const { channel, data } = JSON.parse(message.data);
            handleWebSocketMessage(channel, data);
        } catch (e) {
            console.error('WebSocket message error:', e);
        }
    };
    
    // Send periodic keepalive
    setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            sendWebSocketMessage('peopleOnline');
        }
    }, 30000);
}

function sendWebSocketMessage(channel, data = null) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ channel, data }));
    }
}

function handleWebSocketMessage(channel, data) {
    switch (channel) {
        case 'connected':
            handlePeerConnected(data);
            break;
        case 'begin':
            handleBeginCall();
            break;
        case 'description':
            handleDescription(data);
            break;
        case 'iceCandidate':
            handleIceCandidate(data);
            break;
        case 'message':
            handleMessage(data);
            break;
        case 'typing':
            handleTyping(data);
            break;
        case 'disconnect':
            handleDisconnect();
            break;
        default:
            console.log('Unknown WebSocket message:', channel, data);
    }
}

// WebRTC Setup (same as Ajnabee)
async function initializePeerConnection() {
    const iceConfig = {
        iceServers: [
            { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
        ]
    };

    pc = new RTCPeerConnection(iceConfig);
    pc.sentDescription = false;

    pc.onicecandidate = (e) => {
        if (!e.candidate) return;

        if (!pc.sentRemoteDescription) {
            pc.sentRemoteDescription = true;
            sendWebSocketMessage('description', pc.localDescription);
        }
        sendWebSocketMessage('iceCandidate', e.candidate);
    };

    pc.oniceconnectionstatechange = async () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
            console.log('Peer connection lost:', pc.iceConnectionState);
            await initializeConnection();
        }
    };

    const remoteStream = new MediaStream();
    $videoPeer.srcObject = remoteStream;
    
    if ($loader) $loader.style.display = 'inline-block';

    if (localStream) {
        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        });
    }

    pc.ontrack = (event) => {
        console.log('Received remote track');
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        });
    };
}

// Main initialization function
async function initializeConnection() {
    updateStatus('Looking for someone to video chat with...');
    
    if (window.desktopUpdateButtonStates) {
        window.desktopUpdateButtonStates('connecting');
    }

    try {
        // Initialize WebSocket
        ws = await createWebSocket();
        
        // Initialize WebRTC
        await initializePeerConnection();
        
        // Get interests and start matching
        const interests = window.desktopGetInterestTags ? window.desktopGetInterestTags() : [];
        const twitterHandle = window.desktopGetTwitterHandle ? window.desktopGetTwitterHandle() : '';
        
        if (ws) {
            // Real WebSocket matching
            sendWebSocketMessage('match', { 
                data: 'video', 
                interests: interests,
                twitter: twitterHandle 
            });
        } else {
            // Demo mode - simulate connection
            setTimeout(() => {
                simulateConnection();
            }, 2000 + Math.random() * 3000);
        }
        
    } catch (error) {
        console.error('Connection initialization error:', error);
        updateStatus('Connection failed. Please try again.');
    }
}

// Demo mode for when WebSocket is not available
function simulateConnection() {
    updateStatus('Connected! You are now video chatting with a stranger.');
    
    if (window.desktopUpdateButtonStates) {
        window.desktopUpdateButtonStates('connected');
    }
    
    // Create demo peer video
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    function drawFrame() {
        // Animated gradient background
        const time = Date.now() * 0.001;
        const gradient = ctx.createRadialGradient(320, 240, 0, 320, 240, 300);
        gradient.addColorStop(0, `hsl(${time * 20 % 360}, 60%, 40%)`);
        gradient.addColorStop(1, `hsl(${(time * 20 + 180) % 360}, 40%, 20%)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 640, 480);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Demo Mode', 320, 220);
        ctx.font = '16px Arial';
        ctx.fillText('Stranger\'s video would appear here', 320, 250);
        ctx.fillText('Connect to backend for real peer matching', 320, 280);
        
        requestAnimationFrame(drawFrame);
    }
    drawFrame();
    
    const demoStream = canvas.captureStream(30);
    $videoPeer.srcObject = demoStream;
    
    if ($loader) $loader.style.display = 'none';
    
    // Show demo Twitter handle
    const peerTwitter = $('#peer-twitter');
    if (peerTwitter) {
        peerTwitter.style.display = 'block';
        peerTwitter.querySelector('.twitter-handle').textContent = '@demo_user';
    }
    
    isConnected = true;
}

// WebSocket event handlers
function handlePeerConnected(data) {
    const interests = Array.isArray(data) ? data : [];
    
    let statusMsg = 'Connected! You are now video chatting with a stranger.';
    if (interests.length > 0) {
        const commonInterests = interests.slice(-1)[0] || '';
        const first = interests.slice(0, -1);
        if (first.length) {
            statusMsg += ` You both like ${first.join(', ')} and ${commonInterests}.`;
        } else {
            statusMsg += ` You both like ${commonInterests}.`;
        }
    }
    
    updateStatus(statusMsg);
    
    if (window.desktopUpdateButtonStates) {
        window.desktopUpdateButtonStates('connected');
    }
    
    isConnected = true;
}

async function handleBeginCall() {
    if (!pc) return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
}

async function handleDescription(data) {
    if (!pc) return;
    await pc.setRemoteDescription(data);
    if (!pc.localDescription) {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
    }
}

async function handleIceCandidate(data) {
    if (!pc) return;
    await pc.addIceCandidate(data);
}

function handleMessage(msg) {
    if (!msg) return;
    addMessage('stranger', msg);
}

function handleTyping(isTyping) {
    if ($typing) {
        $typing.style.display = isTyping ? 'block' : 'none';
        if ($msgArea) $msgArea.scrollTop = $msgArea.scrollHeight;
    }
}

function handleDisconnect() {
    console.log('Peer disconnected');
    if (pc) {
        pc.close();
        pc = null;
    }
    isConnected = false;
    initializeConnection();
}

// UI helper functions
function updateStatus(message) {
    if ($msgs) {
        $msgs.innerHTML = `<div class="message-status">${esc(message)}</div>`;
        if ($msgArea) $msgArea.scrollTop = $msgArea.scrollHeight;
    }
}

function addMessage(sender, message) {
    if (!$msgs) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    
    if (sender === 'you') {
        msgDiv.innerHTML = `<span class="you">You:</span> ${esc(message)}`;
    } else {
        msgDiv.innerHTML = `<span class="strange">Stranger:</span> ${esc(message)}`;
    }
    
    $msgs.appendChild(msgDiv);
    if ($msgArea) $msgArea.scrollTop = $msgArea.scrollHeight;
}

// Control functions (called by desktop.js)
window.videoStart = async function() {
    try {
        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        // Set self video
        if ($videoSelf) {
            $videoSelf.srcObject = localStream;
        }
        
        // Show Twitter handle if provided
        const twitterHandle = window.desktopGetTwitterHandle ? window.desktopGetTwitterHandle() : '';
        if (twitterHandle) {
            const selfTwitter = $('#self-twitter');
            if (selfTwitter) {
                selfTwitter.style.display = 'block';
                selfTwitter.querySelector('.twitter-handle').textContent = twitterHandle;
            }
        }
        
        // Start connection process
        await initializeConnection();
        
    } catch (error) {
        console.error('Camera access error:', error);
        alert('Camera and microphone access is required for video chat.');
        
        if (window.desktopUpdateButtonStates) {
            window.desktopUpdateButtonStates('ready');
        }
    }
};

window.videoMuteToggle = function(muted) {
    isMuted = muted;
    if (localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !muted;
        });
    }
};

window.videoToggle = function(videoOff) {
    isVideoOff = videoOff;
    if (localStream) {
        localStream.getVideoTracks().forEach(track => {
            track.enabled = !videoOff;
        });
    }
};

window.videoSkip = function() {
    if (ws) {
        sendWebSocketMessage('disconnect');
    } else {
        // Demo mode - restart connection
        setTimeout(() => {
            simulateConnection();
        }, 1000);
    }
};

// Chat functionality
function setupChat() {
    // Send message
    function sendMessage() {
        if (!$messageInput) return;
        
        const msg = $messageInput.value.trim();
        if (!msg || !isConnected) return;
        
        addMessage('you', msg);
        $messageInput.value = '';
        
        if (ws) {
            sendWebSocketMessage('message', esc(msg));
        }
        
        // Clear typing timeout
        clearInterval(timeout);
        if (ws) sendWebSocketMessage('typing', false);
    }
    
    // Set up event listeners
    if ($messageInput) {
        $messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearInterval(timeout);
                if (ws) sendWebSocketMessage('typing', false);
                sendMessage();
                e.preventDefault();
                return;
            }
            if (ws) sendWebSocketMessage('typing', true);
        });
        
        $messageInput.addEventListener('keyup', () => {
            clearInterval(timeout);
            timeout = setTimeout(() => {
                if (ws) sendWebSocketMessage('typing', false);
            }, debounceTime);
        });
    }
    
    if ($sendBtn) {
        $sendBtn.addEventListener('click', sendMessage);
    }
}

// Initialize video chat when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Video chat system initialized');
    setupChat();
    
    // Hide video loader when peer video plays
    if ($videoPeer) {
        $videoPeer.addEventListener('play', () => {
            if ($loader) $loader.style.display = 'none';
        });
    }
});

console.log('Video.js loaded - Ready for WebRTC connections');
