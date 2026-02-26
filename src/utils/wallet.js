import { ethers } from 'ethers';

const NETWORKS = {
  eth: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  bsc: {
    name: 'BNB Smart Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    }
  }
};

class WalletManager {
  constructor() {
    this.wallet = null;
    this.provider = null;
    this.currentNetwork = 'eth';
    this.loadFromStorage();
  }

  loadFromStorage() {
    const savedWallet = localStorage.getItem('wallet');
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet);
        this.wallet = new ethers.Wallet(walletData.privateKey);
        this.currentNetwork = walletData.network || 'eth';
        this.updateProvider();
      } catch (error) {
        console.error('Failed to load wallet from storage:', error);
      }
    }
  }

  saveToStorage() {
    if (this.wallet) {
      const walletData = {
        privateKey: this.wallet.privateKey,
        network: this.currentNetwork
      };
      localStorage.setItem('wallet', JSON.stringify(walletData));
    }
  }

  updateProvider() {
    const networkConfig = NETWORKS[this.currentNetwork];
    this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
  }

  createWallet() {
    this.wallet = ethers.Wallet.createRandom();
    this.saveToStorage();
    return {
      address: this.wallet.address,
      privateKey: this.wallet.privateKey,
      mnemonic: this.wallet.mnemonic?.phrase
    };
  }

  importWallet(privateKey) {
    try {
      this.wallet = new ethers.Wallet(privateKey);
      this.saveToStorage();
      return {
        address: this.wallet.address,
        privateKey: this.wallet.privateKey
      };
    } catch (error) {
      throw new Error('Invalid private key');
    }
  }

  importWalletFromMnemonic(mnemonicPhrase) {
    try {
      this.wallet = ethers.Wallet.fromPhrase(mnemonicPhrase);
      this.saveToStorage();
      return {
        address: this.wallet.address,
        privateKey: this.wallet.privateKey,
        mnemonic: this.wallet.mnemonic?.phrase
      };
    } catch (error) {
      throw new Error('Invalid mnemonic phrase');
    }
  }

  switchNetwork(network) {
    if (NETWORKS[network]) {
      this.currentNetwork = network;
      this.updateProvider();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  async getBalance() {
    if (!this.wallet || !this.provider) {
      throw new Error('Wallet not initialized');
    }
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  async sendTransaction(to, amount) {
    if (!this.wallet || !this.provider) {
      throw new Error('Wallet not initialized');
    }

    const networkConfig = NETWORKS[this.currentNetwork];
    const tx = {
      to: to,
      value: ethers.parseEther(amount.toString()),
      chainId: networkConfig.chainId
    };

    const connectedWallet = this.wallet.connect(this.provider);
    const transaction = await connectedWallet.sendTransaction(tx);
    return transaction.hash;
  }

  async estimateGas(to, amount) {
    if (!this.wallet || !this.provider) {
      throw new Error('Wallet not initialized');
    }

    const tx = {
      to: to,
      value: ethers.parseEther(amount.toString())
    };

    const gasEstimate = await this.provider.estimateGas(tx);
    const gasPrice = await this.provider.getFeeData();
    
    return {
      gasLimit: gasEstimate.toString(),
      gasPrice: gasPrice.gasPrice?.toString() || '0',
      maxFeePerGas: gasPrice.maxFeePerGas?.toString() || '0',
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString() || '0'
    };
  }

  getAddress() {
    return this.wallet?.address || null;
  }

  getCurrentNetwork() {
    return {
      key: this.currentNetwork,
      ...NETWORKS[this.currentNetwork]
    };
  }

  getAllNetworks() {
    return Object.keys(NETWORKS).map(key => ({
      key,
      ...NETWORKS[key]
    }));
  }

  isWalletInitialized() {
    return this.wallet !== null;
  }

  logout() {
    this.wallet = null;
    this.provider = null;
    localStorage.removeItem('wallet');
  }
}

export default new WalletManager();
export { NETWORKS };