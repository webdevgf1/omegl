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

// Window Management
function openVideoChat() {
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
}

function openGroups() {
    const window = document.getElementById('groupsWindow');
    if (!window) return;
    
    window.classList.add('active');
    window.style.display = 'block';
    openWindows.add('groupsWindow');
    bringWindowToFront('groupsWindow');
    updateTaskbar();
}

function closeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;
    
    window.classList.remove('active');
    window.style.display = 'none';
    openWindows.delete(windowId);
    
    if (activeWindow === windowId) {
        activeWindow = null;
    }
    
    updateTaskbar();
}

function closeVideoWindow() {
    // Clean up video resources
    if (typeof stopVideoChat === 'function') {
        stopVideoChat();
    }
    closeWindow('videoWindow');
}

function minimizeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;
    
    window.classList.remove('active');
    window.style.display = 'none';
    
    if (activeWindow === windowId) {
        activeWindow = null;
    }
    
    updateTaskbar();
}

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
        activeWindow = windowI
