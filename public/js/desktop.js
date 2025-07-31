// Desktop Interface Management

// Global state
let openWindows = new Set();
let activeWindow = null;
let dragState = null;

// Initialize desktop
document.addEventListener('DOMContentLoaded', function() {
    initializeDesktop();
    updateSystemTime();
    setInterval(updateSystemTime, 1000);
    
    // Auto-open video chat window
    setTimeout(() => {
        openVideoChat();
    }, 500);
});

function initializeDesktop() {
    // Make all windows draggable
    const windows = document.querySelectorAll('.window');
    windows.forEach(makeWindowDraggable);
    
    // Set up window click handlers for focus
    windows.forEach(window => {
        window.addEventListener('mousedown', () => {
            bringWindowToFront(window.id);
        });
    });
}

// Window Management Functions (needed for onclick handlers)
window.openVideoChat = function() {
    const window = document.getElementById('videoWindow');
    if (!window) return;
    
    window.classList.add('active');
    window.style.display = 'block';
    openWindows.add('videoWindow');
    bringWindowToFront('videoWindow');
    updateTaskbar();
    
    // Focus the interests input
    setTimeout(() => {
        const interestsInput = document.getElementById('interests');
        if (interestsInput) {
            interestsInput.focus();
        }
    }, 100);
};

window.openGroups = function() {
    const window = document.getElementById('groupsWindow');
    if (!window) return;
    
    window.classList.add('active');
    window.style.display = 'block';
    openWindows.add('groupsWindow');
    bringWindowToFront('groupsWindow');
    updateTaskbar();
};

window.closeWindow = function(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;
    
    window.classList.remove('active');
    window.style.display = 'none';
    openWindows.delete(windowId);
    
    if (activeWindow === windowId) {
        activeWindow = null;
    }
    
    updateTaskbar();
};

window.closeVideoWindow = function() {
    // Clean up video resources
    if (typeof stopVideoChat === 'function') {
        stopVideoChat();
    }
    closeWindow('videoWindow');
};

window.minimizeWindow = function(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;
    
    window.classList.remove('active');
    window.style.display = 'none';
    
    if (activeWindow === windowId) {
        activeWindow = null;
    }
    
    updateTaskbar();
};

function restoreWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;
    
    window.classList.add('active');
    window.style.display = 'block';
    bringWindowToFront(windowId);
    updateTaskbar();
}

function bringWindowToFront(windowId) {
    // Remove active class from all windows
    document.querySelectorAll('.window').forEach(w => {
        w.style.zIndex = '100';
    });
    
    // Bring selected window to front
    const window = document.getElementById(windowId);
    if (window) {
        window.style.zIndex = '200';
        activeWindow = windowId;
    }
}

// Taskbar Management
function updateTaskbar() {
    const taskbarItems = document.getElementById('taskbar-items');
    if (!taskbarItems) return;
    
    taskbarItems.innerHTML = '';
    
    openWindows.forEach(windowId => {
        const window = document.getElementById(windowId);
        if (!window) return;
        
        const titleElement = window.querySelector('.window-title span');
        const title = titleElement ? titleElement.textContent : windowId;
        
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-item';
        if (window.style.display !== 'none' && window.classList.contains('active')) {
            taskbarItem.classList.add('active');
        }
        
        taskbarItem.textContent = title;
        taskbarItem.addEventListener('click', () => {
            if (window.style.display === 'none' || !window.classList.contains('active')) {
                restoreWindow(windowId);
            } else {
                minimizeWindow(windowId);
            }
        });
        
        taskbarItems.appendChild(taskbarItem);
    });
}

// Window Dragging
function makeWindowDraggable(windowElement) {
    const header = windowElement.querySelector('.window-header');
    if (!header) return;
    
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    header.addEventListener('mousedown', function(e) {
        if (e.target.closest('.window-control')) return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = windowElement.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        
        bringWindowToFront(windowElement.id);
        
        document.body.style.cursor = 'move';
        header.style.cursor = 'move';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newX = initialX + deltaX;
        let newY = initialY + deltaY;
        
        const windowRect = windowElement.getBoundingClientRect();
        const maxX = window.innerWidth - windowRect.width;
        const maxY = window.innerHeight - windowRect.height - 32;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        windowElement.style.left = newX + 'px';
        windowElement.style.top = newY + 'px';
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = '';
            header.style.cursor = 'move';
        }
    });
}

// System Time
function updateSystemTime() {
    const timeElement = document.getElementById('system-time');
    if (!timeElement) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    timeElement.textContent = timeString;
}

// Interest Tags Management
function initializeInterestTags() {
    const interestsInput = document.getElementById('interests');
    if (!interestsInput) return;
    
    let tags = [];
    
    interestsInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const value = this.value.trim();
            
            if (value && !tags.includes(value)) {
                tags.push(value);
                updateTagsDisplay();
                this.value = '';
            }
        }
    });
    
    function updateTagsDisplay() {
        let tagsContainer = document.getElementById('tags-display');
        if (!tagsContainer) {
            tagsContainer = document.createElement('div');
            tagsContainer.id = 'tags-display';
            tagsContainer.style.cssText = `
                margin-top: 4px;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            `;
            interestsInput.parentNode.appendChild(tagsContainer);
        }
        
        tagsContainer.innerHTML = '';
        
        tags.forEach((tag, index) => {
            const tagElement = document.createElement('span');
            tagElement.style.cssText = `
                background: #0080ff;
                color: white;
                padding: 2px 6px;
                font-size: 10px;
                border-radius: 2px;
                cursor: pointer;
                border: 1px outset #0080ff;
            `;
            tagElement.innerHTML = `${tag} <span style="margin-left: 4px;">×</span>`;
            
            tagElement.addEventListener('click', () => {
                tags.splice(index, 1);
                updateTagsDisplay();
            });
            
            tagsContainer.appendChild(tagElement);
        });
    }
    
    window.getInterestTags = () => tags;
}

// Twitter Handle Management
function initializeTwitterHandle() {
    const twitterInput = document.getElementById('twitter');
    if (!twitterInput) return;
    
    twitterInput.addEventListener('input', function(e) {
        let value = this.value;
        if (value.startsWith('@')) {
            value = value.substring(1);
            this.value = value;
        }
    });
    
    window.getTwitterHandle = () => {
        const value = twitterInput.value.trim();
        return value ? `@${value}` : '';
    };
}

// Button State Management
function updateButtonStates(state) {
    const startBtn = document.getElementById('start-btn');
    const skipBtn = document.getElementById('skip-btn');
    const muteBtn = document.getElementById('mute-btn');
    const videoToggleBtn = document.getElementById('video-toggle-btn');
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    
    switch(state) {
        case 'ready':
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.textContent = 'Start Video Chat';
            }
            if (skipBtn) skipBtn.disabled = true;
            if (muteBtn) muteBtn.disabled = true;
            if (videoToggleBtn) videoToggleBtn.disabled = true;
            if (sendBtn) sendBtn.disabled = true;
            if (messageInput) messageInput.disabled = true;
            break;
            
        case 'connecting':
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.textContent = 'Connecting...';
            }
            if (skipBtn) skipBtn.disabled = true;
            if (muteBtn) muteBtn.disabled = true;
            if (videoToggleBtn) videoToggleBtn.disabled = true;
            if (sendBtn) sendBtn.disabled = true;
            if (messageInput) messageInput.disabled = true;
            break;
            
        case 'connected':
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.textContent = 'Connected';
            }
            if (skipBtn) skipBtn.disabled = false;
            if (muteBtn) muteBtn.disabled = false;
            if (videoToggleBtn) videoToggleBtn.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            if (messageInput) messageInput.disabled = false;
            break;
    }
}

// Functions for video.js to call
window.toggleMute = function() {
    const muteBtn = document.getElementById('mute-btn');
    if (!muteBtn) return;
    
    const isMuted = muteBtn.textContent === 'Unmute';
    muteBtn.textContent = isMuted ? 'Mute' : 'Unmute';
    muteBtn.style.background = isMuted ? '' : 'linear-gradient(180deg, #ff4040 0%, #c02020 100%)';
    
    if (window.videoMuteToggle) {
        window.videoMuteToggle(!isMuted);
    }
};

window.toggleVideo = function() {
    const videoBtn = document.getElementById('video-toggle-btn');
    if (!videoBtn) return;
    
    const isVideoOff = videoBtn.textContent === 'Video On';
    videoBtn.textContent = isVideoOff ? 'Video Off' : 'Video On';
    videoBtn.style.background = isVideoOff ? '' : 'linear-gradient(180deg, #ff4040 0%, #c02020 100%)';
    
    if (window.videoToggle) {
        window.videoToggle(!isVideoOff);
    }
};

window.skipPeer = function() {
    updateButtonStates('connecting');
    if (window.videoSkip) {
        window.videoSkip();
    }
};

window.startVideoChat = function() {
    updateButtonStates('connecting');
    if (window.videoStart) {
        window.videoStart();
    }
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initializeInterestTags();
    initializeTwitterHandle();
    updateButtonStates('ready');
});

// Export functions
window.desktopUpdateButtonStates = updateButtonStates;
window.desktopGetInterestTags = () => window.getInterestTags ? window.getInterestTags() : [];
window.desktopGetTwitterHandle = () => window.getTwitterHandle ? window.getTwitterHandle() : '';

console.log('Desktop interface initialized - Solmegle Windows 98 Style');
