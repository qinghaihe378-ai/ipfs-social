import { useState, useEffect } from 'react';
import './Wallet.css';
import walletManager, { NETWORKS } from '../utils/wallet';

function Wallet() {
  const [isWalletCreated, setIsWalletCreated] = useState(false);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showImportWallet, setShowImportWallet] = useState(false);
  const [showSendTransaction, setShowSendTransaction] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [currentNetwork, setCurrentNetwork] = useState('eth');
  const [privateKey, setPrivateKey] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [gasEstimate, setGasEstimate] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletManager.isWalletInitialized()) {
      setIsWalletCreated(true);
      setWalletAddress(walletManager.getAddress());
      setCurrentNetwork(walletManager.getCurrentNetwork().key);
      loadBalance();
    }
  }, []);

  const loadBalance = async () => {
    try {
      const balance = await walletManager.getBalance();
      setBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleCreateWallet = () => {
    const walletData = walletManager.createWallet();
    setIsWalletCreated(true);
    setWalletAddress(walletData.address);
    setMnemonic(walletData.mnemonic);
    setShowCreateWallet(false);
    loadBalance();
  };

  const handleImportWallet = async () => {
    try {
      if (privateKey) {
        const walletData = walletManager.importWallet(privateKey);
        setIsWalletCreated(true);
        setWalletAddress(walletData.address);
        setShowImportWallet(false);
        loadBalance();
      } else if (mnemonic) {
        const walletData = walletManager.importWalletFromMnemonic(mnemonic);
        setIsWalletCreated(true);
        setWalletAddress(walletData.address);
        setShowImportWallet(false);
        loadBalance();
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSwitchNetwork = (network) => {
    if (walletManager.switchNetwork(network)) {
      setCurrentNetwork(network);
      loadBalance();
    }
  };

  const handleSendTransaction = async () => {
    try {
      setLoading(true);
      const hash = await walletManager.sendTransaction(sendTo, sendAmount);
      setTxHash(hash);
      setShowSendTransaction(false);
      setSendTo('');
      setSendAmount('');
      loadBalance();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateGas = async () => {
    try {
      const estimate = await walletManager.estimateGas(sendTo, sendAmount);
      setGasEstimate(estimate);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    walletManager.logout();
    setIsWalletCreated(false);
    setWalletAddress('');
    setBalance('0');
    setMnemonic('');
  };

  const networks = walletManager.getAllNetworks();

  if (!isWalletCreated) {
    return (
      <div className="wallet-container">
        <div className="wallet-header">
          <h2>加密钱包</h2>
        </div>
        <div className="wallet-actions">
          <button className="wallet-btn" onClick={() => setShowCreateWallet(true)}>
            创建新钱包
          </button>
          <button className="wallet-btn" onClick={() => setShowImportWallet(true)}>
            导入钱包
          </button>
        </div>

        {showCreateWallet && (
          <div className="wallet-modal">
            <div className="wallet-modal-content">
              <h3>创建新钱包</h3>
              <p>创建钱包后，请妥善保管您的助记词，它是恢复钱包的唯一方式。</p>
              <div className="wallet-modal-actions">
                <button className="wallet-btn cancel" onClick={() => setShowCreateWallet(false)}>
                  取消
                </button>
                <button className="wallet-btn confirm" onClick={handleCreateWallet}>
                  创建
                </button>
              </div>
            </div>
          </div>
        )}

        {showImportWallet && (
          <div className="wallet-modal">
            <div className="wallet-modal-content">
              <h3>导入钱包</h3>
              <div className="wallet-input-group">
                <label>私钥</label>
                <input
                  type="password"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="输入私钥"
                />
              </div>
              <div className="wallet-input-group">
                <label>助记词</label>
                <textarea
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  placeholder="输入助记词（用空格分隔）"
                  rows={3}
                />
              </div>
              <div className="wallet-modal-actions">
                <button className="wallet-btn cancel" onClick={() => setShowImportWallet(false)}>
                  取消
                </button>
                <button className="wallet-btn confirm" onClick={handleImportWallet}>
                  导入
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h2>加密钱包</h2>
        <button className="logout-btn" onClick={handleLogout}>
          退出
        </button>
      </div>

      <div className="wallet-balance">
        <div className="balance-label">余额</div>
        <div className="balance-amount">
          {parseFloat(balance).toFixed(6)} {NETWORKS[currentNetwork].nativeCurrency.symbol}
        </div>
      </div>

      <div className="wallet-address">
        <div className="address-label">地址</div>
        <div className="address-value">{walletAddress}</div>
      </div>

      <div className="wallet-network">
        <div className="network-label">网络</div>
        <div className="network-selector">
          {networks.map((network) => (
            <button
              key={network.key}
              className={`network-btn ${currentNetwork === network.key ? 'active' : ''}`}
              onClick={() => handleSwitchNetwork(network.key)}
            >
              {network.name}
            </button>
          ))}
        </div>
      </div>

      <div className="wallet-actions">
        <button className="wallet-btn" onClick={() => setShowSendTransaction(true)}>
          发送交易
        </button>
        <button className="wallet-btn" onClick={loadBalance}>
          刷新余额
        </button>
      </div>

      {mnemonic && (
        <div className="wallet-mnemonic">
          <div className="mnemonic-header">
            <span>助记词</span>
            <button onClick={() => setShowMnemonic(!showMnemonic)}>
              {showMnemonic ? '隐藏' : '显示'}
            </button>
          </div>
          {showMnemonic && (
            <div className="mnemonic-content">
              {mnemonic}
            </div>
          )}
        </div>
      )}

      {showSendTransaction && (
        <div className="wallet-modal">
          <div className="wallet-modal-content">
            <h3>发送交易</h3>
            <div className="wallet-input-group">
              <label>接收地址</label>
              <input
                type="text"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="输入接收地址"
              />
            </div>
            <div className="wallet-input-group">
              <label>金额</label>
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder={`输入金额 (${NETWORKS[currentNetwork].nativeCurrency.symbol})`}
                step="0.000001"
              />
            </div>
            {gasEstimate && (
              <div className="gas-estimate">
                <div>Gas Limit: {gasEstimate.gasLimit}</div>
                <div>Gas Price: {gasEstimate.gasPrice} Wei</div>
              </div>
            )}
            <div className="wallet-modal-actions">
              <button className="wallet-btn cancel" onClick={() => {
                setShowSendTransaction(false);
                setGasEstimate(null);
              }}>
                取消
              </button>
              <button className="wallet-btn" onClick={handleEstimateGas}>
                估算Gas
              </button>
              <button className="wallet-btn confirm" onClick={handleSendTransaction} disabled={loading}>
                {loading ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      )}

      {txHash && (
        <div className="tx-success">
          <div>交易已发送！</div>
          <div className="tx-hash">{txHash}</div>
        </div>
      )}
    </div>
  );
}

export default Wallet;