'use strict';

    document.addEventListener('DOMContentLoaded', () => {
      // DOM Selectors
      const projectForm = document.getElementById('projectForm');
      const feeModal = document.getElementById('feeModal');
      const walletModal = document.getElementById('walletModal');
      const proceedButton = document.getElementById('proceedButton');
      const browserWalletButton = document.getElementById('browserWalletButton');
      const walletConnectButton = document.getElementById('walletConnectButton');
      const closeButtons = document.querySelectorAll('.modal .close');

      let wcProvider = null;

      // Close helper
      const hideAllModals = () => {
        feeModal.style.display = 'none';
        walletModal.style.display = 'none';
      };

      // Form validation and submit routing
      if (projectForm) {
        projectForm.addEventListener('submit', (event) => {
          event.preventDefault();
          
          const mintAddress = document.getElementById('mintAddress').value.trim();
          if (mintAddress.length < 32 || mintAddress.length > 44) {
            alert('Please enter a standard format Solana Mint Address.');
            return;
          }
          feeModal.style.display = 'flex';
        });
      }

      // Progress through flow steps
      if (proceedButton) {
        proceedButton.addEventListener('click', () => {
          feeModal.style.display = 'none';
          walletModal.style.display = 'flex';
        });
      }

      // Dismissal UI handlers
      closeButtons.forEach(btn => btn.addEventListener('click', hideAllModals));
      window.addEventListener('click', (e) => {
        if (e.target === feeModal || e.target === walletModal) hideAllModals();
      });

      // Browser Extension Connection Logic
      if (browserWalletButton) {
        browserWalletButton.addEventListener('click', async () => {
          const provider = window.solana || window.solflare;

          if (provider) {
            try {
              const response = await provider.connect();
              const walletAddress = response.publicKey.toString();
              
              console.log("Connected to browser provider address:", walletAddress);
              alert(`Wallet Connected!\nAddress: ${walletAddress.substring(0,6)}...${walletAddress.substring(walletAddress.length - 6)}`);
              hideAllModals();
            } catch (err) {
              console.error("Connection declined:", err);
              alert("Connection request was rejected.");
            }
          } else {
            alert("No recognized Solana browser extension found. Opening Phantom installation landing page.");
            window.open("https://phantom.app/", "_blank");
          }
        });
      }

      // WalletConnect Universal Connection Setup
      if (walletConnectButton) {
        walletConnectButton.addEventListener('click', async () => {
          try {
            if (wcProvider) {
              await wcProvider.disconnect().catch(() => {});
              wcProvider = null;
            }

            walletConnectButton.disabled = true;
            
            // Dynamic integration via standard ESM module loader
            const { UniversalProvider } = await import('https://esm.sh/@walletconnect/universal-provider@2.15.0');

            wcProvider = await UniversalProvider.init({
              projectId: "59ba0228712f04a947916abb7db06ab1", 
              metadata: {
                name: 'SPL Listing Portal',
                description: 'Decentralized form tool for registration metadata.',
                url: window.location.origin,
                icons: ['https://solana.com/favicon.ico']
              }
            });

            const session = await wcProvider.connect({
              namespaces: {
                solana: {
                  chains: ['solana:5eykt4UsFv8P8NJdTREpY1vzq9JQZSh9'],
                  methods: ['solana_signTransaction', 'solana_signMessage'],
                  events: ['chainChanged', 'accountsChanged']
                }
              },
              skipPairing: false
            });

            if (session?.namespaces?.solana?.accounts?.length > 0) {
              const fullAddress = session.namespaces.solana.accounts[0];
              const walletAddress = fullAddress.split(':')[2];
              
              console.log("WalletConnect Session Established:", walletAddress);
              alert(`WalletConnect Connected!\nAddress: ${walletAddress.substring(0,6)}...${walletAddress.substring(walletAddress.length - 6)}`);
              hideAllModals();
            }
          } catch (err) {
            console.error("Session configuration error:", err);
            alert("WalletConnect interface initialization error. Please verify configuration setup parameters.");
          } finally {
            walletConnectButton.disabled = false;
          }
        });
      }
    });
