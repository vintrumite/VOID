'use strict';

/* ============================
   DOM REFERENCES
   ============================ */
const projectForm = document.getElementById('projectForm');
const feeModal = document.getElementById('feeModal');
const walletModal = document.getElementById('walletModal');
const closeButtons = document.getElementsByClassName('close');
const proceedButton = document.getElementById('proceedButton');

// Updated buttons to match the new Solana layout
const connectSplButton = document.getElementById('connectSplButton');
const walletConnectButton = document.getElementById('connectWalletConnectButton');

// Global state variables for the connection
let walletAddress = null;
let web3Modal = null;

/* ============================
   INITIALIZE WALLETCONNECT V2 (SOLANA)
   ============================ */
if (window.Web3Modal) {
  web3Modal = new window.Web3Modal.Web3Modal({
    projectId: "59ba0228712f04a947916abb7db06ab1", // Your WalletConnect project ID
    walletConnectVersion: 2,
    standaloneChains: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'] // Solana Mainnet CAIP-2 ID
  });
}

/* ============================
   UI MODAL FLOW
   ============================ */
if (projectForm && feeModal) {
  projectForm.addEventListener('submit', (event) => {
    event.preventDefault();
    feeModal.classList.remove('hidden');
    feeModal.style.display = 'flex';
  });
}

if (closeButtons[0] && feeModal) {
  closeButtons[0].addEventListener('click', () => {
    feeModal.style.display = 'none';
  });
}

if (proceedButton && feeModal && walletModal) {
  proceedButton.addEventListener('click', () => {
    feeModal.style.display = 'none';
    walletModal.classList.remove('hidden');
    walletModal.style.display = 'flex';
  });
}

if (closeButtons[1] && walletModal) {
  closeButtons[1].addEventListener('click', () => {
    walletModal.style.display = 'none';
  });
}

/* ============================
   BUTTON EVENT LISTENERS
   ============================ */
if (connectSplButton) {
  connectSplButton.addEventListener('click', connectSplWallet);
}

if (walletConnectButton) {
  walletConnectButton.addEventListener('click', connectWalletConnect);
}

/* ============================
   NATIVE SPL WALLET CONNECTION
   ============================ */
async function connectSplWallet() {
  try {
    // Looks for standard browser extensions like Phantom (window.solana) or Solflare (window.solflare)
    const provider = window.solana || window.solflare;

    if (!provider) {
      alert("Solana wallet extension not found! Please install Phantom or Solflare, or choose WalletConnect.");
      return;
    }

    // Trigger connection request
    const response = await provider.connect();
    
    // Extract Public Key string safely based on provider type
    walletAddress = provider.publicKey ? provider.publicKey.toString() : response.publicKey.toString();
    console.log("Connected natively via Extension. Public Key:", walletAddress);

    // Update UI state upon success
    onConnectionSuccess(walletAddress);

  } catch (error) {
    console.error("User cancelled or rejected the connection request:", error);
    alert("Connection rejected by user.");
  }
}

/* ============================
   WALLETCONNECT V2 SOLANA CONNECTION
   ============================ */
async function connectWalletConnect() {
  try {
    if (!web3Modal) {
      alert("WalletConnect library failed to load properly. Please refresh.");
      return;
    }

    walletConnectButton.disabled = true;

    // Open the official WalletConnect standalone modal interface
    await web3Modal.openModal();
    console.log("WalletConnect modal opened successfully.");

  } catch (err) {
    console.error("Error opening WalletConnect modal:", err);
    alert("Could not open connection modal. Please try again.");
  } finally {
    walletConnectButton.disabled = false;
  }
}

/* ============================
   POST-CONNECTION HANDLING
   ============================ */
function onConnectionSuccess(address) {
  // Hide the wallet selection UI
  if (walletModal) {
    walletModal.style.display = 'none';
  }

  // Visual confirmation for the user
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  alert(`Successfully connected to Solana!\nWallet: ${shortAddress}`);

  // You can now proceed with submitting your form data to your backend,
  // knowing you have verified the user's presence with their valid public key.
}
