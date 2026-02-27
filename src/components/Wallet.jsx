import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import walletManager, { NETWORKS } from '../utils/wallet';
import './Wallet.css';

function Wallet() {
  const { t } = useTranslation();
  const [isWalletCreated, setIsWalletCreated] = useState(false);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showImportWallet, setShowImportWallet] = useState(false);
  const [showSendTransaction, setShowSendTransaction] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [tokenPrice, setTokenPrice] = useState('0');
  const [priceChange, setPriceChange] = useState('-3.66');
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  useEffect(() => {
    if (walletManager.isWalletInitialized()) {
      setIsWalletCreated(true);
      setWalletAddress(walletManager.getAddress());
      const networkKey = walletManager.getCurrentNetwork().key;
      setCurrentNetwork(networkKey);
      loadBalance();
      loadTokenPrice(networkKey);
    }
  }, []);

  const loadTokenPrice = async (network = currentNetwork) => {
    try {
      let price = 0;
      
      if (network === 'eth' || network === 'base') {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        price = data.ethereum?.usd || 0;
      } else if (network === 'bsc') {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
        const data = await response.json();
        price = parseFloat(data.price) || 0;
      }
      
      if (price > 0) {
        setTokenPrice(price.toFixed(2));
      }
    } catch (error) {
      console.error('Failed to load token price:', error);
    }
  };

  const loadBalance = async () => {
    try {
      setLoading(true);
      setError('');
      const balance = await walletManager.getBalance();
      setBalance(balance);
    } catch (error) {
      setError(t('加载余额失败: ') + error.message);
      console.error('Failed to load balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = () => {
    try {
      const walletData = walletManager.createWallet();
      setIsWalletCreated(true);
      setWalletAddress(walletData.address);
      setMnemonic(walletData.mnemonic);
      setShowCreateWallet(false);
      setSuccess(t('钱包创建成功！请妥善保管您的助记词。'));
      loadBalance();
    } catch (error) {
      setError(t('创建钱包失败: ') + error.message);
    }
  };

  const handleImportWallet = async () => {
    try {
      setError('');
      if (privateKey) {
        const walletData = walletManager.importWallet(privateKey);
        setIsWalletCreated(true);
        setWalletAddress(walletData.address);
        setShowImportWallet(false);
        setSuccess(t('钱包导入成功！'));
        loadBalance();
      } else if (mnemonic) {
        const walletData = walletManager.importWalletFromMnemonic(mnemonic);
        setIsWalletCreated(true);
        setWalletAddress(walletData.address);
        setShowImportWallet(false);
        setSuccess(t('钱包导入成功！'));
        loadBalance();
      } else {
        setError(t('请输入私钥或助记词'));
      }
    } catch (error) {
      setError(t('导入钱包失败: ') + error.message);
    }
  };

  const handleSwitchNetwork = (network) => {
    try {
      if (walletManager.switchNetwork(network)) {
        setCurrentNetwork(network);
        loadBalance();
        loadTokenPrice(network);
      }
    } catch (error) {
      setError(t('切换网络失败: ') + error.message);
    }
  };

  const handleSendTransaction = async () => {
    try {
      if (!sendTo || !sendAmount) {
        setError(t('请输入接收地址和金额'));
        return;
      }
      setLoading(true);
      setError('');
      const hash = await walletManager.sendTransaction(sendTo, sendAmount);
      setTxHash(hash);
      setShowSendTransaction(false);
      setSendTo('');
      setSendAmount('');
      setGasEstimate(null);
      setSuccess(t('交易已发送！'));
      loadBalance();
    } catch (error) {
      setError(t('发送交易失败: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateGas = async () => {
    try {
      if (!sendTo || !sendAmount) {
        setError(t('请输入接收地址和金额'));
        return;
      }
      const estimate = await walletManager.estimateGas(sendTo, sendAmount);
      setGasEstimate(estimate);
      setError('');
    } catch (error) {
      setError(t('估算Gas失败: ') + error.message);
    }
  };

  const handleLogout = () => {
    walletManager.logout();
    setIsWalletCreated(false);
    setWalletAddress('');
    setBalance('0');
    setMnemonic('');
    setSuccess('');
    setError('');
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const networks = walletManager.getAllNetworks();

  if (!isWalletCreated) {
    return (
      <div className="wallet-section wallet-empty-state">
        {error && (
          <div className="wallet-error">
            {error}
          </div>
        )}
        
        {success && (
          <div className="wallet-success">
            {success}
          </div>
        )}
        
        <div className="wallet-empty-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        </div>
        
        <div className="wallet-empty-title">
          {t('内置钱包')}
        </div>
        
        <div className="wallet-empty-description">
          {t('安全、便捷的多链钱包')}
        </div>
        
        <div className="wallet-empty-actions">
          <button className="wallet-empty-btn primary" onClick={() => setShowCreateWallet(true)} disabled={loading}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            {t('创建新钱包')}
          </button>
          <button className="wallet-empty-btn secondary" onClick={() => setShowImportWallet(true)} disabled={loading}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            {t('导入钱包')}
          </button>
        </div>

        {showCreateWallet && (
          <div className="wallet-modal">
            <div className="wallet-modal-content">
              <h3>{t('创建新钱包')}</h3>
              <p>{t('创建钱包后，请妥善保管您的助记词，它是恢复钱包的唯一方式。')}</p>
              <div className="wallet-modal-actions">
                <button className="wallet-modal-btn cancel" onClick={() => setShowCreateWallet(false)}>
                  {t('取消')}
                </button>
                <button className="wallet-modal-btn confirm" onClick={handleCreateWallet}>
                  {t('创建')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showImportWallet && (
          <div className="wallet-modal">
            <div className="wallet-modal-content">
              <h3>{t('导入钱包')}</h3>
              <div className="wallet-input-group">
                <label>{t('私钥')}</label>
                <input
                  type="password"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder={t('输入私钥')}
                />
              </div>
              <div className="wallet-input-group">
                <label>{t('助记词')}</label>
                <textarea
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  placeholder={t('输入助记词（用空格分隔）')}
                  rows={3}
                />
              </div>
              <div className="wallet-modal-actions">
                <button className="wallet-modal-btn cancel" onClick={() => setShowImportWallet(false)}>
                  {t('取消')}
                </button>
                <button className="wallet-modal-btn confirm" onClick={handleImportWallet}>
                  {t('导入')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet-section">
      {error && (
        <div className="wallet-error">
          {error}
        </div>
      )}

      <div className="wallet-header">
        <div className="wallet-header-top">
          <div className="wallet-title">{t('钱包')}</div>
          <div className="wallet-network-dropdown">
            <div className="wallet-network-badge" onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}>
              <span>{NETWORKS[currentNetwork].name}</span>
              <svg className={`network-dropdown-arrow ${showNetworkDropdown ? 'open' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
            {showNetworkDropdown && (
              <div className="network-dropdown-menu">
                {networks.map((network) => (
                  <div
                    key={network.key}
                    className={`network-dropdown-item ${currentNetwork === network.key ? 'active' : ''}`}
                    onClick={() => {
                      handleSwitchNetwork(network.key);
                      setShowNetworkDropdown(false);
                    }}
                  >
                    {network.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="wallet-balance">
          <div className="balance-amount">
            {loading ? t('加载中...') : `${parseFloat(balance).toFixed(6)}`}
          </div>
          <div className="balance-currency">{NETWORKS[currentNetwork].nativeCurrency.symbol}</div>
        </div>
        <div className="wallet-total-value">
          ≈ ${(parseFloat(balance) * parseFloat(tokenPrice.replace(',', ''))).toFixed(2)}
        </div>
      </div>

      <div className="wallet-actions-grid">
        <button className="wallet-action-item" onClick={() => setShowReceiveModal(true)} disabled={loading}>
          <div className="wallet-action-icon receive-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/>
            </svg>
          </div>
          <div className="wallet-action-text">{t('接收')}</div>
        </button>
        <button className="wallet-action-item" onClick={() => setShowSendTransaction(true)} disabled={loading}>
          <div className="wallet-action-icon send-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>
            </svg>
          </div>
          <div className="wallet-action-text">{t('发送')}</div>
        </button>
        <button className="wallet-action-item" onClick={loadBalance} disabled={loading}>
          <div className="wallet-action-icon refresh-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </div>
          <div className="wallet-action-text">{loading ? t('刷新中...') : t('刷新')}</div>
        </button>
      </div>

      <div className="wallet-address-card">
        <div className="address-label">{t('钱包地址')}</div>
        <div className="address-value">{walletAddress}</div>
      </div>

      <div className="wallet-tokens-section">
        <div className="tokens-label">{t('代币持有')}</div>
        <div className="token-list">
          <div className="token-item">
            <div className="token-icon">
              <img 
                src={currentNetwork === 'eth' || currentNetwork === 'base' 
                  ? 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' 
                  : 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png'} 
                alt={NETWORKS[currentNetwork].nativeCurrency.symbol}
                className="token-icon-img"
              />
            </div>
            <div className="token-info">
              <div className="token-symbol">{NETWORKS[currentNetwork].nativeCurrency.symbol}</div>
              <div className="token-balance">{loading ? t('加载中...') : `${parseFloat(balance).toFixed(6)}`}</div>
            </div>
            <div className="token-balance-info">
              <div className="token-price">${tokenPrice}</div>
              <div className={`token-change ${priceChange.includes('-') ? 'negative' : 'positive'}`}>
                {priceChange}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {mnemonic && (
        <div className="wallet-mnemonic-card">
          <div className="mnemonic-header">
            <span>{t('助记词')}</span>
            <div>
              <button onClick={() => setShowMnemonic(!showMnemonic)}>
                {showMnemonic ? t('隐藏') : t('显示')}
              </button>
              <button onClick={handleCopyMnemonic}>
                {copied ? t('已复制') : t('复制')}
              </button>
            </div>
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
            <h3>{t('发送交易')}</h3>
            <div className="wallet-input-group">
              <label>{t('接收地址')}</label>
              <input
                type="text"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder={t('输入接收地址')}
              />
            </div>
            <div className="wallet-input-group">
              <label>{t('金额')}</label>
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder={t('输入金额')}
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
              <button className="wallet-modal-btn cancel" onClick={() => {
                setShowSendTransaction(false);
                setGasEstimate(null);
              }}>
                {t('取消')}
              </button>
              <button className="wallet-modal-btn" onClick={handleEstimateGas}>
                {t('估算Gas')}
              </button>
              <button className="wallet-modal-btn confirm" onClick={handleSendTransaction} disabled={loading}>
                {loading ? t('发送中...') : t('发送')}
              </button>
            </div>
          </div>
        </div>
      )}

      {txHash && (
        <div className="tx-success">
          <div>{t('交易已发送！')}</div>
          <div className="tx-hash">{txHash}</div>
        </div>
      )}

      {showReceiveModal && (
        <div className="wallet-modal">
          <div className="wallet-modal-content">
            <h3>{t('接收资产')}</h3>
            <div className="wallet-address-card">
              <div className="address-label">{t('钱包地址')}</div>
              <div className="address-value">{walletAddress}</div>
              <button className="copy-address-btn" onClick={handleCopyAddress}>
                {copied ? t('已复制') : t('复制地址')}
              </button>
            </div>
            <div className="wallet-modal-actions">
              <button className="wallet-modal-btn confirm" onClick={() => setShowReceiveModal(false)}>
                {t('关闭')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wallet;