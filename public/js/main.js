// Basic main.js for Solmegle Desktop

function configureTopbar() {
    // Logo click handler - only if logo exists
    const logo = document.getElementById('logo');
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
}

function configureFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    const btn = document.getElementById('feedback-btn');
    const close = document.querySelector('#feedbackModal .close');
    const text = document.getElementById('feedbackText');
    const form = document.getElementById('feedbackForm');

    // Only configure if elements exist
    if (!modal || !btn) return;

    btn.onclick = () => {
        modal.style.display = 'block';
    };

    if (close) {
        close.onclick = () => {
            modal.style.display = 'none';
        };
    }

    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            if (!text) return;
            
            let feedback = text.value;
            text.value = '';
            modal.style.display = 'none';
            
            // Send feedback to backend
            try {
                await fetch('/feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ feedback }),
                });
                console.log('Feedback sent successfully');
            } catch (error) {
                console.log('Feedback could not be sent:', error);
            }
        };
    }
}

// Initialize main functions
document.addEventListener('DOMContentLoaded', function() {
    configureTopbar();
    configureFeedbackModal();
    console.log('Main.js initialized');
});

// Prevent errors if functions are called before DOM is ready
if (typeof configureTopbar !== 'undefined') {
    try {
        configureTopbar();
    } catch (e) {
        // Silently handle missing elements
    }
}

if (typeof configureFeedbackModal !== 'undefined') {
    try {
        configureFeedbackModal();
    } catch (e) {
        // Silently handle missing elements
    }
}
