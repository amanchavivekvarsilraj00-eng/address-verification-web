document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');
    const verificationBadge = document.getElementById('verificationResult');
    const badgeText = verificationBadge.querySelector('.text');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Set Loading State
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        
        // Hide previous badge if exists
        verificationBadge.className = 'verification-badge hidden';

        // 2. Gather Data
        const formData = new FormData(form);
        const name = formData.get('name');
        const phone = formData.get('phone');
        const country = formData.get('country');
        const postalValue = formData.get('pincode');
        
        let addressPayload = {
            street: formData.get('street'),
            city: formData.get('city')
        };
        
        // Add state if applicable (UK doesn't use it)
        if (country !== 'uk') {
            addressPayload.state = formData.get('state');
        }
        
        // Use the correct postal code field name for each country API
        if (country === 'india') {
            addressPayload.pincode = postalValue;
        } else if (country === 'usa') {
            addressPayload.zipcode = postalValue;
        } else if (country === 'uk') {
            addressPayload.postcode = postalValue;
        }

        const payload = {
            country: country,
            address: addressPayload
        };

        try {
            // 3. Call API - pointing to the deployed Vercel API endpoint
            const response = await fetch('https://address-verification-api-rho.vercel.app/api/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            // 4. Update UI based on Address Validity
            verificationBadge.classList.remove('hidden', 'valid', 'invalid');
            
            if (!response.ok || result.error) {
                // If there's a server error (e.g., 500 Internal Server Error)
                verificationBadge.classList.add('invalid');
                badgeText.textContent = `Server Error: ${result.error || response.statusText}`;
            } else {
                // Check if the address was actually verified (do not use result.success, that just means the API didn't crash)
                const isVerified = result.isVerified || result.verified === true;
                
                if (isVerified) {
                    verificationBadge.classList.add('valid');
                    badgeText.textContent = 'Address Verified Successfully';
                } else {
                    verificationBadge.classList.add('invalid');
                    badgeText.textContent = 'Invalid or Unrecognized Address';
                }
            }
            
            // 5. Continue Login Process as Requested
            setTimeout(() => {
                alert(`Login successful for ${name}! Phone: ${phone}\n(This is a simulated successful login as requested, regardless of address validity)`);
                // Reset form or redirect user here in a real app
                // form.reset();
                // window.location.href = '/dashboard';
            }, 800);

        } catch (error) {
            console.error('Error verifying address:', error);
            verificationBadge.classList.remove('hidden');
            verificationBadge.classList.add('invalid');
            badgeText.textContent = 'Error communicating with server';
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            // Re-show button text (wait a bit so badge animation plays first)
        }
    });
});
