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
    
    // Only configure if elements exist
    if (!modal || !btn) {
        console.log('Feedback modal elements not found, skipping configuration');
        return;
    }

    const close = document.querySelector('#feedbackModal .close');
    const text = document.getElementById('feedbackText');
    const form = document.getElementById('feedbackForm');

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

// Safe initialization - only run if DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Only configure elements that exist
    try {
        configureFeedbackModal();
        console.log('Main.js initialized successfully');
    } catch (error) {
        console.log('Some main.js functions skipped due to missing elements');
    }
});
