import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useTranslation } from 'react-i18next';
import './Bot.css';
import walletManager from '../utils/wallet';

const NETWORKS = {
  eth: {
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    nativeToken: 'ETH'
  },
  base: {
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    nativeToken: 'ETH'
  },
  bsc: {
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    nativeToken: 'BNB'
  }
};

const WETH_ADDRESSES = {
  eth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  base: '0x4200000000000000000000000000000000000006',
  bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
};

const QUOTE_TOKENS = {
  eth: [
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 }
  ],
  base: [
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 }
  ],
  bsc: [
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18 },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 18 },
    { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', decimals: 18 }
  ]
};

const DEX_CONFIGS = {
  eth: [
    {
      name: 'Uniswap V2',
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      type: 'v2'
    },
    {
      name: 'Uniswap V3',
      router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      type: 'v3'
    },
    {
      name: 'Uniswap V4',
      poolManager: '0x000000000004444c5dc75cB358380D2e3dE08A90',
      quoter: '0x52f0e24d1c21c8a0cb1e5a5dd6198556bd9e1203',
      stateView: '0x7ffe42c4a5deea5b0fec41c94c136cf115597227',
      universalRouter: '0x66a9893cc07d91d95644aedd05d03f95e1dba8af',
      type: 'v4'
    },
    {
      name: 'SushiSwap',
      router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      factory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
      type: 'v2'
    }
  ],
  base: [
    {
      name: 'Uniswap V2',
      router: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
      factory: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
      type: 'v2'
    },
    {
      name: 'Uniswap V3',
      router: '0x2626664c2603336E57B271c5C0b26F421741e481',
      factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
      quoter: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
      type: 'v3'
    },
    {
      name: 'Uniswap V4',
      poolManager: '0x498581ff718922c3f8e6a244956af099b2652b2b',
      quoter: '0x0d5e0f971ed27fbff6c2837bf31316121532048d',
      stateView: '0xa3c0c9b65bad0b08107aa264b0f3db444b867a71',
      universalRouter: '0x6ff5693b99212da76ad316178a184ab56d299b43',
      type: 'v4'
    },
    {
      name: 'BaseSwap',
      router: '0x327Df1E6de05895d2ab08513aDD9B9647126758E',
      factory: '0xFDa619b6dB9B883D20d395ed9C6326875FbAcc32',
      type: 'v2'
    }
  ],
  bsc: [
    {
      name: 'PancakeSwap V2',
      router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
      type: 'v2'
    },
    {
      name: 'PancakeSwap V3',
      router: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
      factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      quoter: '0x78D78E420Da98ad378D7799bE8f4AF69033EB077',
      type: 'v3'
    },
    {
      name: 'Uniswap V4',
      poolManager: '0x28e2ea090877bf75740558f6bfb36a5ffee9e9df',
      quoter: '0x9f75dd27d6664c475b90e105573e550ff69437b0',
      stateView: '0xd13dd3d6e93f276fafc9db9e6bb47c1180aee0c4',
      universalRouter: '0x1906c1d672b88cd1b9ac7593301ca990f94eae07',
      type: 'v4'
    },
    {
      name: 'Uniswap V2',
      router: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
      factory: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
      type: 'v2'
    },
    {
      name: 'Uniswap V3',
      router: '0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2',
      factory: '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7',
      quoter: '0x78D78E420Da98ad378D7799bE8f4AF69033EB077',
      type: 'v3'
    }
  ]
};

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)'
];

const UNISWAP_V2_ROUTER_ABI = [
  'function getAmountsOut(uint256 amountIn, address[] path) external view returns (uint256[] amounts)',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) external payable returns (uint256[] amounts)',
  'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)'
];

const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

const UNISWAP_V3_QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)'
];

const UNISWAP_V3_FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
  'function getPool(address tokenA, address tokenB) external view returns (address pool)'
];

const UNISWAP_V3_POOL_ABI = [
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

const V3_FEES = [100, 500, 2500, 3000, 10000];

const UNISWAP_V4_QUOTER_ABI = [
  'function quoteExactInputSingle((address poolKey, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96) params) external returns (int256 amountIn, int256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  'function quoteExactOutputSingle((address poolKey, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96) params) external returns (int256 amountIn, int256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)'
];

const UNISWAP_V4_POOL_MANAGER_ABI = [
  'function getSlot((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key) external view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)',
  'function getLiquidity((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key) external view returns (uint128 liquidity)'
];

const UNISWAP_V4_STATE_VIEW_ABI = [
  'function getSlot0((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key) external view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)',
  'function getLiquidity((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key) external view returns (uint128 liquidity)'
];

const Bot = () => {
  const { t } = useTranslation();
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [currentNetwork, setCurrentNetwork] = useState('eth');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(1);
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [autoBuyAmount, setAutoBuyAmount] = useState('');
  const [autoSellPrice, setAutoSellPrice] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bestRoute, setBestRoute] = useState(null);
  const [liquidityAnalysis, setLiquidityAnalysis] = useState(null);
  const [analyzingLiquidity, setAnalyzingLiquidity] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [tokenDetail, setTokenDetail] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [balance, setBalance] = useState('0.0000');
  const [sellPercentage, setSellPercentage] = useState(100);
  const [buyAmounts] = useState(['0.01', '0.05', '0.1', '0.5', '1']);
  const [sellPercentages] = useState([25, 50, 75, 100]);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [antiRugMode, setAntiRugMode] = useState(true);
  const [rugCheckResult, setRugCheckResult] = useState(null);
  const [checkingRug, setCheckingRug] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (walletManager.isWalletInitialized()) {
      setIsWalletConnected(true);
      setWalletAddress(walletManager.getAddress());
      setCurrentNetwork(walletManager.getCurrentNetwork().key);
      updateBalance();
    }
  }, [currentNetwork]);

  const updateBalance = async () => {
    if (walletManager.isWalletInitialized()) {
      try {
        const networkConfig = NETWORKS[currentNetwork];
        const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
        const balance = await provider.getBalance(walletManager.getAddress());
        setBalance(ethers.formatEther(balance).substring(0, 6));
      } catch (error) {
        console.error('获取余额失败:', error);
      }
    }
  };

  const parseCommand = (command) => {
    const parts = command.trim().split(/\s+/);
    const action = parts[0].toLowerCase();
    const params = parts.slice(1);
    return { action, params };
  };

  const detectTokenNetwork = (tokenAddress) => {
    try {
      const address = tokenAddress.toLowerCase();
      
      if (address.startsWith('0x') && address.length === 42) {
        const checksumAddress = ethers.getAddress(tokenAddress);
        
        const knownTokens = {
          eth: [
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'.toLowerCase(),
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase(),
            '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase(),
            '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase()
          ],
          bsc: [
            '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'.toLowerCase(),
            '0x55d398326f99059fF775485246999027B3197955'.toLowerCase(),
            '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'.toLowerCase()
          ],
          base: [
            '0x4200000000000000000000000000000000000006'.toLowerCase(),
            '0x833589fCD6eDb6E08f4c7C32D4f71b54bDA02913'.toLowerCase()
          ]
        };
        
        for (const [network, tokens] of Object.entries(knownTokens)) {
          if (tokens.includes(address)) {
            return network;
          }
        }
        
        return currentNetwork;
      }
      
      return currentNetwork;
    } catch (error) {
      console.error('检测网络失败:', error);
      return currentNetwork;
    }
  };

  const switchNetworkIfNeeded = async (tokenAddress) => {
    const detectedNetwork = detectTokenNetwork(tokenAddress);
    
    if (detectedNetwork !== currentNetwork) {
      if (walletManager.switchNetwork(detectedNetwork)) {
        setCurrentNetwork(detectedNetwork);
        setSuccess(`已自动切换到${detectedNetwork.toUpperCase()}网络`);
        return true;
      }
    }
    return false;
  };

  const executeCommand = async (command) => {
    try {
      const { action, params } = parseCommand(command);
      
      setCommandHistory([...commandHistory, { command, timestamp: new Date().toLocaleString() }]);
      setCommandInput('');
      
      switch (action) {
        case '/info':
          await executeInfoCommand(params);
          break;
        case '/buy':
          await executeBuyCommand(params);
          break;
        case '/sell':
          await executeSellCommand(params);
          break;
        case '/help':
          showHelp();
          break;
        case '/clear':
          setCommandHistory([]);
          break;
        default:
          setError(`未知指令: ${action}。输入 /help 查看可用指令`);
      }
    } catch (error) {
      setError(`指令执行失败: ${error.message}`);
    }
  };

  const executeInfoCommand = async (params) => {
    if (params.length < 1) {
      setError('用法: /info <代币地址>');
      return;
    }

    const [tokenAddr] = params;
    
    if (!ethers.isAddress(tokenAddr)) {
      setError('无效的代币地址');
      return;
    }

    const detectedNetwork = detectTokenNetwork(tokenAddr);
    await switchNetworkIfNeeded(tokenAddr);
    
    setTokenAddress(tokenAddr);
    setLoadingPrice(true);
    
    try {
      const info = await getTokenInfo(tokenAddr, detectedNetwork);
      if (!info) {
        setError('获取代币信息失败');
        return;
      }
      
      const liquidity = await analyzeLiquidity(tokenAddr, detectedNetwork);
      const price = await getTokenPrice(tokenAddr, info.symbol, detectedNetwork);
      
      setTokenDetail({
        address: tokenAddr,
        network: detectedNetwork,
        ...info,
        liquidity,
        price
      });
    } catch (error) {
      setError(`获取代币信息失败: ${error.message}`);
    } finally {
      setLoadingPrice(false);
    }
  };

  const executeBuyCommand = async (params) => {
    if (params.length < 2) {
      setError('用法: /buy <代币地址> <数量>');
      return;
    }

    const [tokenAddr, amountStr] = params;
    
    if (!ethers.isAddress(tokenAddr)) {
      setError('无效的代币地址');
      return;
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setError('无效的数量');
      return;
    }

    const detectedNetwork = detectTokenNetwork(tokenAddr);
    await switchNetworkIfNeeded(tokenAddr);
    
    setTokenAddress(tokenAddr);
    setAmount(amountStr);
    
    await getTokenInfo(tokenAddr, detectedNetwork);
    await analyzeLiquidity(tokenAddr, detectedNetwork);
    
    await handleBuy();
  };

  const executeSellCommand = async (params) => {
    if (params.length < 2) {
      setError('用法: /sell <代币地址> <数量>');
      return;
    }

    const [tokenAddr, amountStr] = params;
    
    if (!ethers.isAddress(tokenAddr)) {
      setError('无效的代币地址');
      return;
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setError('无效的数量');
      return;
    }

    const detectedNetwork = detectTokenNetwork(tokenAddr);
    await switchNetworkIfNeeded(tokenAddr);
    
    setTokenAddress(tokenAddr);
    setAmount(amountStr);
    
    await getTokenInfo(tokenAddr, detectedNetwork);
    await analyzeLiquidity(tokenAddr, detectedNetwork);
    
    await handleSell();
  };

  const showHelp = () => {
    const helpText = `
可用指令:
/info <代币地址>        - 查询代币信息（流动性、价格、涨幅）
/buy <代币地址> <数量>  - 购买代币
/sell <代币地址> <数量> - 卖出代币
/help                     - 显示帮助信息
/clear                    - 清除命令历史

示例:
/info 0x1234...
/buy 0x1234... 0.1
/sell 0x1234... 100
    `;
    setSuccess(helpText.trim());
  };

  const analyzeLiquidity = async (tokenAddr, network = currentNetwork) => {
    try {
      setAnalyzingLiquidity(true);
      setError('');
      
      console.log('analyzeLiquidity - 开始分析流动性, 网络:', network);
      const networkConfig = NETWORKS[network];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      
      const quoteTokens = QUOTE_TOKENS[network] || [];
      const dexConfigs = DEX_CONFIGS[network];
      const analysis = [];

      for (const dex of dexConfigs) {
        try {
          console.log(`analyzeLiquidity - 分析 ${dex.name}...`);
          
          for (const quoteToken of quoteTokens) {
            if (quoteToken.address.toLowerCase() === tokenAddr.toLowerCase()) continue;
            
            if (dex.type === 'v2') {
              const factory = new ethers.Contract(
                dex.factory,
                ['function getPair(address tokenA, address tokenB) external view returns (address pair)'],
                provider
              );
              
              let pairAddress;
              try {
                pairAddress = await factory.getPair(tokenAddr, quoteToken.address);
              } catch (e) {
                continue;
              }
              
              if (pairAddress && pairAddress !== ethers.ZeroAddress) {
                const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
                const reserves = await pair.getReserves();
                const token0 = await pair.token0();
                const token1 = await pair.token1();
                
                const reserve0 = reserves[0];
                const reserve1 = reserves[1];
                
                const quoteReserve = token0.toLowerCase() === quoteToken.address.toLowerCase() ? reserve0 : reserve1;
                const tokenReserve = token0.toLowerCase() === quoteToken.address.toLowerCase() ? reserve1 : reserve0;
                
                let liquidityUSD = 0;
                if (quoteToken.symbol === 'USDT' || quoteToken.symbol === 'USDC') {
                  const liquidity = parseFloat(ethers.formatUnits(quoteReserve, quoteToken.decimals));
                  liquidityUSD = liquidity;
                } else {
                  const liquidity = parseFloat(ethers.formatEther(quoteReserve));
                  const ethPrice = await getETHPrice(network);
                  liquidityUSD = liquidity * ethPrice;
                }
                
                if (liquidityUSD > 0) {
                  console.log(`analyzeLiquidity - ${dex.name} (${quoteToken.symbol}) 流动性(USD):`, liquidityUSD);
                  
                  analysis.push({
                    dex: `${dex.name} (${quoteToken.symbol})`,
                    type: 'v2',
                    liquidity: liquidityUSD,
                    quoteToken: quoteToken.symbol,
                    wethReserve: quoteReserve.toString(),
                    tokenReserve: tokenReserve.toString(),
                    pairAddress
                  });
                }
              }
            } else if (dex.type === 'v3' && dex.factory) {
              const factory = new ethers.Contract(dex.factory, UNISWAP_V3_FACTORY_ABI, provider);
              
              for (const fee of V3_FEES) {
                try {
                  const poolAddress = await factory.getPool(tokenAddr, quoteToken.address, fee);
                  
                  if (poolAddress && poolAddress !== ethers.ZeroAddress) {
                    const pool = new ethers.Contract(poolAddress, UNISWAP_V3_POOL_ABI, provider);
                    const liquidity = await pool.liquidity();
                    const slot0 = await pool.slot0();
                    const sqrtPriceX96 = slot0[0];
                    
                    let liquidityUSD = 0;
                    if (quoteToken.symbol === 'USDT' || quoteToken.symbol === 'USDC') {
                      const liquidityNum = parseFloat(ethers.formatUnits(liquidity, quoteToken.decimals));
                      liquidityUSD = liquidityNum;
                    } else {
                      const liquidityNum = parseFloat(ethers.formatEther(liquidity));
                      const ethPrice = await getETHPrice(network);
                      liquidityUSD = liquidityNum * ethPrice * 0.01;
                    }
                    
                    if (liquidityUSD > 0) {
                      analysis.push({
                        dex: `${dex.name} (${quoteToken.symbol}, ${fee / 10000}% fee)`,
                        type: 'v3',
                        fee: fee,
                        liquidity: liquidityUSD,
                        quoteToken: quoteToken.symbol,
                        poolAddress,
                        sqrtPriceX96: sqrtPriceX96.toString()
                      });
                      
                      console.log(`analyzeLiquidity - ${dex.name} (${quoteToken.symbol}, ${fee/10000}%) 流动性: $${liquidityUSD.toFixed(2)}`);
                    }
                  }
                } catch (e) {
                  continue;
                }
              }
            } else if (dex.type === 'v4' && dex.stateView) {
              const stateView = new ethers.Contract(dex.stateView, UNISWAP_V4_STATE_VIEW_ABI, provider);
              
              for (const fee of V3_FEES) {
                try {
                  const tickSpacing = fee / 50;
                  const currency0 = quoteToken.address.toLowerCase() < tokenAddr.toLowerCase() ? quoteToken.address : tokenAddr;
                  const currency1 = quoteToken.address.toLowerCase() < tokenAddr.toLowerCase() ? tokenAddr : quoteToken.address;
                  
                  const poolKey = {
                    currency0: currency0,
                    currency1: currency1,
                    fee: fee,
                    tickSpacing: tickSpacing,
                    hooks: ethers.ZeroAddress
                  };
                  
                  const liquidity = await stateView.getLiquidity(poolKey);
                  
                  let liquidityUSD = 0;
                  if (quoteToken.symbol === 'USDT' || quoteToken.symbol === 'USDC') {
                    const liquidityNum = parseFloat(ethers.formatUnits(liquidity, quoteToken.decimals));
                    liquidityUSD = liquidityNum;
                  } else {
                    const liquidityNum = parseFloat(ethers.formatEther(liquidity));
                    const ethPrice = await getETHPrice(network);
                    liquidityUSD = liquidityNum * ethPrice * 0.01;
                  }
                  
                  if (liquidityUSD > 0) {
                    analysis.push({
                      dex: `${dex.name} (${quoteToken.symbol}, ${fee / 10000}% fee)`,
                      type: 'v4',
                      fee: fee,
                      liquidity: liquidityUSD,
                      quoteToken: quoteToken.symbol,
                      poolManager: dex.poolManager
                    });
                    
                    console.log(`analyzeLiquidity - ${dex.name} (${quoteToken.symbol}, ${fee/10000}%) 流动性: $${liquidityUSD.toFixed(2)}`);
                  }
                } catch (e) {
                  continue;
                }
              }
            }
          }
        } catch (err) {
          console.error(`analyzeLiquidity - 分析${dex.name}流动性失败:`, err);
        }
      }

      console.log('analyzeLiquidity - 分析结果:', analysis);
      const bestDex = analysis
        .filter(a => a.liquidity > 0)
        .sort((a, b) => b.liquidity - a.liquidity)[0];

      setLiquidityAnalysis(analysis);
      setBestRoute(bestDex);
      
      return analysis;
    } catch (error) {
      console.error('analyzeLiquidity - 错误:', error);
      setError(`流动性分析失败: ${error.message}`);
      return [];
    } finally {
      setAnalyzingLiquidity(false);
    }
  };

  const getTokenInfo = async (tokenAddr, network = currentNetwork) => {
    try {
      const networkConfig = NETWORKS[network];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
      
      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals()
      ]);

      setTokenInfo({ name, symbol, decimals });
      return { name, symbol, decimals };
    } catch (error) {
      setError('获取代币信息失败，请检查代币地址');
      return null;
    }
  };

  const checkRugPull = async (tokenAddr, network = currentNetwork) => {
    try {
      setCheckingRug(true);
      setRugCheckResult(null);
      
      const networkConfig = NETWORKS[network];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      
      const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
      
      const warnings = [];
      const infos = [];
      let riskLevel = 'low';
      
      try {
        const totalSupply = await tokenContract.totalSupply();
        const decimals = await tokenContract.decimals();
        const symbol = await tokenContract.symbol();
        
        const totalSupplyFormatted = parseFloat(ethers.formatUnits(totalSupply, decimals));
        
        const ownerBalance = await tokenContract.balanceOf(await tokenContract.owner?.() || ethers.ZeroAddress);
        
        try {
          const owner = await tokenContract.owner();
          const ownerBalance = await tokenContract.balanceOf(owner);
          const ownerPercent = (parseFloat(ethers.formatUnits(ownerBalance, decimals)) / totalSupplyFormatted) * 100;
          
          if (ownerPercent > 50) {
            warnings.push(`⚠️ 所有者持有 ${ownerPercent.toFixed(2)}% 代币`);
            riskLevel = 'high';
          } else if (ownerPercent > 30) {
            warnings.push(`⚡ 所有者持有 ${ownerPercent.toFixed(2)}% 代币`);
            riskLevel = riskLevel === 'high' ? 'high' : 'medium';
          } else {
            infos.push(`✅ 所有者持有 ${ownerPercent.toFixed(2)}% 代币`);
          }
        } catch (e) {
          infos.push('ℹ️ 无法获取所有者信息');
        }
        
        try {
          const paused = await tokenContract.paused?.();
          if (paused) {
            warnings.push('🚨 代币合约已暂停交易');
            riskLevel = 'high';
          }
        } catch (e) {}
        
        try {
          const isBlacklisted = await tokenContract.isBlacklisted?.(ethers.ZeroAddress);
        } catch (e) {
          try {
            const blacklistRole = await tokenContract.BLACKLIST_ROLE?.();
            if (blacklistRole) {
              warnings.push('⚠️ 合约有黑名单功能');
              riskLevel = riskLevel === 'high' ? 'high' : 'medium';
            }
          } catch (e2) {}
        }
        
        try {
          const maxTxAmount = await tokenContract._maxTxAmount?.() || await tokenContract.maxTransactionAmount?.();
          if (maxTxAmount && maxTxAmount > 0n) {
            const maxTxPercent = (parseFloat(ethers.formatUnits(maxTxAmount, decimals)) / totalSupplyFormatted) * 100;
            if (maxTxPercent < 1) {
              warnings.push(`⚠️ 最大交易限制: ${maxTxPercent.toFixed(2)}%`);
              riskLevel = riskLevel === 'high' ? 'high' : 'medium';
            } else {
              infos.push(`ℹ️ 最大交易限制: ${maxTxPercent.toFixed(2)}%`);
            }
          }
        } catch (e) {}
        
        try {
          const maxWallet = await tokenContract._maxWalletSize?.() || await tokenContract.maxWallet?.();
          if (maxWallet && maxWallet > 0n) {
            const maxWalletPercent = (parseFloat(ethers.formatUnits(maxWallet, decimals)) / totalSupplyFormatted) * 100;
            if (maxWalletPercent < 2) {
              warnings.push(`⚠️ 最大钱包限制: ${maxWalletPercent.toFixed(2)}%`);
              riskLevel = riskLevel === 'high' ? 'high' : 'medium';
            } else {
              infos.push(`ℹ️ 最大钱包限制: ${maxWalletPercent.toFixed(2)}%`);
            }
          }
        } catch (e) {}
        
        try {
          const buyFee = await tokenContract.totalBuyFee?.() || await tokenContract.buyTotalFees?.();
          const sellFee = await tokenContract.totalSellFee?.() || await tokenContract.sellTotalFees?.();
          
          if (buyFee || sellFee) {
            const buyFeePercent = buyFee ? Number(buyFee) / 100 : 0;
            const sellFeePercent = sellFee ? Number(sellFee) / 100 : 0;
            
            if (sellFeePercent > 20 || buyFeePercent > 20) {
              warnings.push(`🚨 高税费: 买 ${buyFeePercent}% / 卖 ${sellFeePercent}%`);
              riskLevel = 'high';
            } else if (sellFeePercent > 10 || buyFeePercent > 10) {
              warnings.push(`⚠️ 中等税费: 买 ${buyFeePercent}% / 卖 ${sellFeePercent}%`);
              riskLevel = riskLevel === 'high' ? 'high' : 'medium';
            } else {
              infos.push(`ℹ️ 税费: 买 ${buyFeePercent}% / 卖 ${sellFeePercent}%`);
            }
          }
        } catch (e) {}
        
        const code = await provider.getCode(tokenAddr);
        
        const suspiciousPatterns = [
          { pattern: 'selfdestruct', name: '自毁功能' },
          { pattern: 'suicide', name: '自毁功能' },
          { pattern: 'delegatecall', name: '代理调用' },
          { pattern: 'setOwner', name: '可更改所有者' },
          { pattern: 'transferOwnership', name: '可转移所有权' }
        ];
        
        for (const { pattern, name } of suspiciousPatterns) {
          if (code.toLowerCase().includes(pattern.toLowerCase())) {
            if (pattern === 'selfdestruct' || pattern === 'suicide') {
              warnings.push(`🚨 检测到${name}`);
              riskLevel = 'high';
            } else {
              infos.push(`ℹ️ 存在${name}功能`);
            }
          }
        }
        
      } catch (e) {
        console.log('checkRugPull - 部分检测失败:', e.message);
      }
      
      const result = {
        riskLevel,
        warnings,
        infos,
        timestamp: Date.now()
      };
      
      setRugCheckResult(result);
      return result;
      
    } catch (error) {
      console.error('checkRugPull - 检测失败:', error);
      const result = {
        riskLevel: 'unknown',
        warnings: ['无法完成安全检测'],
        infos: [],
        timestamp: Date.now()
      };
      setRugCheckResult(result);
      return result;
    } finally {
      setCheckingRug(false);
    }
  };

  const getTokenPriceFromDexScreener = async (tokenAddr) => {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddr}`);
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        const sortedPairs = data.pairs.sort((a, b) => {
          const liquidityA = a.liquidity?.usd || 0;
          const liquidityB = b.liquidity?.usd || 0;
          return liquidityB - liquidityA;
        });
        
        const bestPair = sortedPairs[0];
        
        return {
          current: bestPair.priceUsd ? parseFloat(bestPair.priceUsd) : 0,
          change24h: bestPair.priceChange?.h24 || 0,
          change1h: bestPair.priceChange?.h1 || 0,
          change6h: bestPair.priceChange?.h6 || 0,
          liquidity: bestPair.liquidity?.usd || 0,
          volume24h: bestPair.volume?.h24 || 0,
          dex: bestPair.dexId || '',
          pairAddress: bestPair.pairAddress || ''
        };
      }
      
      return null;
    } catch (error) {
      console.log('getTokenPriceFromDexScreener - 获取失败:', error.message);
      return null;
    }
  };

  const getTokenPrice = async (tokenAddr, symbol, network) => {
    try {
      console.log('getTokenPrice - 开始获取价格, 网络:', network);
      
      const dexScreenerData = await getTokenPriceFromDexScreener(tokenAddr);
      if (dexScreenerData && dexScreenerData.current > 0) {
        console.log('getTokenPrice - 从DexScreener获取价格:', dexScreenerData);
        return {
          current: dexScreenerData.current,
          change24h: dexScreenerData.change24h,
          change1h: dexScreenerData.change1h,
          change6h: dexScreenerData.change6h,
          liquidity: dexScreenerData.liquidity,
          volume24h: dexScreenerData.volume24h,
          dex: dexScreenerData.dex
        };
      }
      
      const networkConfig = NETWORKS[network];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const dexConfigs = DEX_CONFIGS[network];
      
      let tokenDecimals = 18;
      try {
        const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
        tokenDecimals = await tokenContract.decimals();
      } catch (e) {
        console.log('getTokenPrice - 无法获取代币decimals，使用默认值18');
      }
      
      let priceInUSD = 0;
      let bestDexName = '';
      
      const quoteTokens = QUOTE_TOKENS[network] || [];
      
      for (const quoteToken of quoteTokens) {
        if (quoteToken.address.toLowerCase() === tokenAddr.toLowerCase()) continue;
        
        for (const dex of dexConfigs) {
          try {
            let tokenAmount = 0;
            let priceFromQuote = 0;
            
            if (dex.type === 'v2') {
              const router = new ethers.Contract(dex.router, UNISWAP_V2_ROUTER_ABI, provider);
              const amountIn = ethers.parseUnits('1', quoteToken.decimals);
              const path = [quoteToken.address, tokenAddr];
              
              try {
                const amountsOut = await router.getAmountsOut(amountIn, path);
                tokenAmount = parseFloat(ethers.formatUnits(amountsOut[1], tokenDecimals));
              } catch (e) {
                continue;
              }
            } else if (dex.type === 'v3' && dex.quoter) {
              const quoter = new ethers.Contract(dex.quoter, UNISWAP_V3_QUOTER_ABI, provider);
              const amountIn = ethers.parseUnits('1', quoteToken.decimals);
              
              for (const fee of V3_FEES) {
                try {
                  const amountOut = await quoter.quoteExactInputSingle(
                    quoteToken.address,
                    tokenAddr,
                    fee,
                    amountIn,
                    0
                  );
                  const amount = parseFloat(ethers.formatUnits(amountOut, tokenDecimals));
                  if (amount > tokenAmount) {
                    tokenAmount = amount;
                  }
                } catch (e) {
                  continue;
                }
              }
            } else if (dex.type === 'v4' && dex.quoter) {
              const quoter = new ethers.Contract(dex.quoter, UNISWAP_V4_QUOTER_ABI, provider);
              const amountIn = ethers.parseUnits('1', quoteToken.decimals);
              
              for (const fee of V3_FEES) {
                try {
                  const tickSpacing = fee / 50;
                  const currency0 = quoteToken.address.toLowerCase() < tokenAddr.toLowerCase() ? quoteToken.address : tokenAddr;
                  const currency1 = quoteToken.address.toLowerCase() < tokenAddr.toLowerCase() ? tokenAddr : quoteToken.address;
                  
                  const poolKey = {
                    currency0: currency0,
                    currency1: currency1,
                    fee: fee,
                    tickSpacing: tickSpacing,
                    hooks: ethers.ZeroAddress
                  };
                  const zeroForOne = quoteToken.address.toLowerCase() < tokenAddr.toLowerCase();
                  
                  const params = {
                    poolKey: poolKey,
                    zeroForOne: zeroForOne,
                    amountSpecified: amountIn,
                    sqrtPriceLimitX96: 0
                  };
                  
                  const result = await quoter.quoteExactInputSingle(params);
                  const amountOut = zeroForOne ? result.amountOut : result.amountIn;
                  const amount = parseFloat(ethers.formatUnits(amountOut < 0 ? -amountOut : amountOut, tokenDecimals));
                  if (amount > tokenAmount) {
                    tokenAmount = amount;
                  }
                } catch (e) {
                  continue;
                }
              }
            }
            
            if (tokenAmount > 0) {
              if (quoteToken.symbol === 'USDT' || quoteToken.symbol === 'USDC') {
                priceFromQuote = 1 / tokenAmount;
              } else {
                let nativePrice = 0;
                if (network === 'eth' || network === 'base') {
                  try {
                    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
                    const data = await response.json();
                    nativePrice = data.ethereum?.usd || 0;
                  } catch (e) {
                    nativePrice = 2000;
                  }
                } else if (network === 'bsc') {
                  try {
                    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
                    const data = await response.json();
                    nativePrice = parseFloat(data.price) || 0;
                  } catch (e) {
                    nativePrice = 300;
                  }
                }
                priceFromQuote = nativePrice / tokenAmount;
              }
              
              if (priceFromQuote > priceInUSD) {
                priceInUSD = priceFromQuote;
                bestDexName = `${dex.name} (${quoteToken.symbol})`;
              }
              
              console.log(`getTokenPrice - ${dex.name} (${quoteToken.symbol}): ${tokenAmount} tokens, $${priceFromQuote.toFixed(8)}`);
            }
          } catch (error) {
            console.log(`getTokenPrice - ${dex.name} 获取失败:`, error.message);
          }
        }
      }
      
      console.log(`getTokenPrice - 最佳价格来自 ${bestDexName}: $${priceInUSD}`);
      
      return {
        current: priceInUSD,
        change24h: 0,
        dex: bestDexName
      };
    } catch (error) {
      console.error('getTokenPrice - 外层错误:', error);
      return {
        current: 0,
        change24h: 0
      };
    }
  };

  const getETHPrice = async (network) => {
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
      
      return price;
    } catch (error) {
      console.error('获取ETH价格失败:', error);
      return 0;
    }
  };

  const calculateBestRoute = async (tokenAddr, amountIn, network = currentNetwork) => {
    try {
      const networkConfig = NETWORKS[network];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const wethAddress = WETH_ADDRESSES[network];
      const quoteTokens = QUOTE_TOKENS[network] || [];
      
      const dexConfigs = DEX_CONFIGS[network];
      const routes = [];

      for (const dex of dexConfigs) {
        if (dex.type !== 'v2') continue;
        
        try {
          const router = new ethers.Contract(dex.router, UNISWAP_V2_ROUTER_ABI, provider);
          
          const directPath = [wethAddress, tokenAddr];
          try {
            const amountsOut = await router.getAmountsOut(amountIn, directPath);
            if (amountsOut[1] > 0n) {
              routes.push({
                dex: dex.name,
                router: dex.router,
                amountOut: amountsOut[1],
                path: directPath,
                type: 'v2'
              });
            }
          } catch (e) {
            console.log(`${dex.name} 直接路径不可用`);
          }
          
          for (const quoteToken of quoteTokens) {
            if (quoteToken.address.toLowerCase() === tokenAddr.toLowerCase()) continue;
            if (quoteToken.symbol === 'WETH' || quoteToken.symbol === 'WBNB') continue;
            
            const multiPath = [wethAddress, quoteToken.address, tokenAddr];
            try {
              const amountsOut = await router.getAmountsOut(amountIn, multiPath);
              if (amountsOut[2] > 0n) {
                routes.push({
                  dex: `${dex.name} (${quoteToken.symbol})`,
                  router: dex.router,
                  amountOut: amountsOut[2],
                  path: multiPath,
                  type: 'v2'
                });
              }
            } catch (e) {
              console.log(`${dex.name} ${quoteToken.symbol} 路径不可用`);
            }
          }
        } catch (err) {
          console.error(`计算${dex.name}路径失败:`, err);
        }
      }

      const bestRoute = routes.sort((a, b) => {
        if (typeof a.amountOut === 'bigint' && typeof b.amountOut === 'bigint') {
          return Number(b.amountOut - a.amountOut);
        }
        return Number(b.amountOut) - Number(a.amountOut);
      })[0];
      
      return bestRoute;
    } catch (error) {
      console.error('计算最优路径失败:', error);
      return null;
    }
  };

  const calculateBestSellRoute = async (tokenAddr, amountIn, network = currentNetwork) => {
    try {
      const networkConfig = NETWORKS[network];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const wethAddress = WETH_ADDRESSES[network];
      const quoteTokens = QUOTE_TOKENS[network] || [];
      
      const dexConfigs = DEX_CONFIGS[network];
      const routes = [];

      for (const dex of dexConfigs) {
        if (dex.type !== 'v2') continue;
        
        try {
          const router = new ethers.Contract(dex.router, UNISWAP_V2_ROUTER_ABI, provider);
          
          const directPath = [tokenAddr, wethAddress];
          try {
            const amountsOut = await router.getAmountsOut(amountIn, directPath);
            if (amountsOut[1] > 0n) {
              routes.push({
                dex: dex.name,
                router: dex.router,
                amountOut: amountsOut[1],
                path: directPath,
                type: 'v2'
              });
            }
          } catch (e) {
            console.log(`${dex.name} 直接卖出路径不可用`);
          }
          
          for (const quoteToken of quoteTokens) {
            if (quoteToken.address.toLowerCase() === tokenAddr.toLowerCase()) continue;
            if (quoteToken.symbol === 'WETH' || quoteToken.symbol === 'WBNB') continue;
            
            const multiPath = [tokenAddr, quoteToken.address, wethAddress];
            try {
              const amountsOut = await router.getAmountsOut(amountIn, multiPath);
              if (amountsOut[2] > 0n) {
                routes.push({
                  dex: `${dex.name} (${quoteToken.symbol})`,
                  router: dex.router,
                  amountOut: amountsOut[2],
                  path: multiPath,
                  type: 'v2'
                });
              }
            } catch (e) {
              console.log(`${dex.name} ${quoteToken.symbol} 卖出路径不可用`);
            }
          }
        } catch (err) {
          console.error(`计算${dex.name}卖出路径失败:`, err);
        }
      }

      const bestRoute = routes.sort((a, b) => {
        if (typeof a.amountOut === 'bigint' && typeof b.amountOut === 'bigint') {
          return Number(b.amountOut - a.amountOut);
        }
        return Number(b.amountOut) - Number(a.amountOut);
      })[0];
      
      return bestRoute;
    } catch (error) {
      console.error('计算卖出最优路径失败:', error);
      return null;
    }
  };

  const handleTokenAddressChange = async (e) => {
    const address = e.target.value;
    setTokenAddress(address);
    
    if (ethers.isAddress(address)) {
      const detectedNetwork = detectTokenNetwork(address);
      await switchNetworkIfNeeded(address);
      await getTokenInfo(address, detectedNetwork);
      await analyzeLiquidity(address, detectedNetwork);
    }
  };

  const handleBuy = async () => {
    if (!isWalletConnected) {
      setError('请先连接钱包');
      return;
    }

    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      setError('请输入有效的代币地址');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('请输入有效的数量');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (antiRugMode) {
        const rugCheck = await checkRugPull(tokenAddress, currentNetwork);
        if (rugCheck.riskLevel === 'high') {
          setError(`⚠️ 高风险代币，建议谨慎交易！\n${rugCheck.warnings.join('\n')}`);
          setLoading(false);
          return;
        }
      }

      const wallet = walletManager.getWallet();
      const networkConfig = NETWORKS[currentNetwork];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const signer = wallet.connect(provider);
      
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const wethAddress = WETH_ADDRESSES[currentNetwork];
      
      const amountIn = ethers.parseEther(amount);
      
      const bestRoute = await calculateBestRoute(tokenAddress, amountIn, currentNetwork);
      if (!bestRoute) {
        setError('无法找到交易路径');
        return;
      }

      console.log('handleBuy - 最佳路由:', bestRoute);

      const router = new ethers.Contract(bestRoute.router, UNISWAP_V2_ROUTER_ABI, signer);
      const path = bestRoute.path;
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      
      const amountsOut = await router.getAmountsOut(amountIn, path);
      const amountOutMin = amountsOut[amountsOut.length - 1].sub(amountsOut[amountsOut.length - 1].mul(Math.floor(slippage)).div(100));
      
      const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
        amountOutMin,
        path,
        wallet.address,
        deadline,
        { value: amountIn }
      );
      
      await tx.wait();
      
      setSuccess(`买入成功！使用${bestRoute.dex}，交易哈希: ${tx.hash}`);
      addTransaction('买入', tokenAddress, amount, tx.hash, bestRoute.dex);
      updateBalance();
    } catch (error) {
      setError(`买入失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!isWalletConnected) {
      setError('请先连接钱包');
      return;
    }

    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      setError('请输入有效的代币地址');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('请输入有效的数量');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const wallet = walletManager.getWallet();
      const networkConfig = NETWORKS[currentNetwork];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const signer = wallet.connect(provider);
      
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const wethAddress = WETH_ADDRESSES[currentNetwork];
      
      const tokenBalance = await tokenContract.balanceOf(wallet.address);
      const sellAmount = tokenBalance.mul(sellPercentage).div(100);
      
      if (sellAmount.isZero()) {
        setError('代币余额不足');
        return;
      }
      
      const bestRoute = await calculateBestSellRoute(tokenAddress, sellAmount, currentNetwork);
      if (!bestRoute) {
        setError('无法找到交易路径');
        return;
      }

      console.log('handleSell - 最佳路由:', bestRoute);

      const router = new ethers.Contract(bestRoute.router, UNISWAP_V2_ROUTER_ABI, signer);
      const path = bestRoute.path;
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      
      const amountsOut = await router.getAmountsOut(sellAmount, path);
      const amountOutMin = amountsOut[amountsOut.length - 1].sub(amountsOut[amountsOut.length - 1].mul(Math.floor(slippage)).div(100));
      
      const approveTx = await tokenContract.approve(bestRoute.router, sellAmount);
      await approveTx.wait();
      
      const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        sellAmount,
        amountOutMin,
        path,
        wallet.address,
        deadline
      );
      
      await tx.wait();
      
      setSuccess(`卖出成功！使用${bestRoute.dex}，交易哈希: ${tx.hash}`);
      addTransaction('卖出', tokenAddress, ethers.formatEther(sellAmount), tx.hash, bestRoute.dex);
      updateBalance();
    } catch (error) {
      setError(`卖出失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = (type, tokenAddr, amount, txHash, dex) => {
    const newTransaction = {
      id: Date.now(),
      type,
      tokenAddress: tokenAddr,
      amount,
      txHash,
      dex,
      timestamp: new Date().toLocaleString()
    };
    setTransactions([newTransaction, ...transactions]);
  };

  const toggleAutoTrading = () => {
    setIsAutoTrading(!isAutoTrading);
    if (!isAutoTrading) {
      setSuccess('自动交易已启动');
    } else {
      setSuccess('自动交易已停止');
    }
  };

  const loadTokenInfo = async () => {
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      setError('请输入有效的代币地址');
      return;
    }

    const detectedNetwork = detectTokenNetwork(tokenAddress);
    await switchNetworkIfNeeded(tokenAddress);
    
    setLoadingPrice(true);
    setError('');
    
    try {
      console.log('开始获取代币信息...');
      const info = await getTokenInfo(tokenAddress, detectedNetwork);
      console.log('代币信息:', info);
      
      if (!info) {
        setError('获取代币信息失败');
        return;
      }
      
      console.log('开始分析流动性...');
      const liquidity = await analyzeLiquidity(tokenAddress, detectedNetwork);
      console.log('流动性分析结果:', liquidity);
      
      console.log('开始获取价格...');
      const price = await getTokenPrice(tokenAddress, info.symbol, detectedNetwork);
      console.log('价格信息:', price);
      
      const detail = {
        address: tokenAddress,
        network: detectedNetwork,
        ...info,
        liquidity,
        price
      };
      
      console.log('设置代币详情:', detail);
      setTokenDetail(detail);
    } catch (error) {
      console.error('获取代币信息失败:', error);
      setError(`获取代币信息失败: ${error.message}`);
    } finally {
      setLoadingPrice(false);
    }
  };

  const selectBuyAmount = (buyAmount) => {
    setAmount(buyAmount);
  };

  const selectSellPercentage = (percentage) => {
    setSellPercentage(percentage);
  };

  return (
    <div className="bot-container">
      <div className="bot-header">
        <h2>{t('交易机器人')}</h2>
        <div className="wallet-status">
          {isWalletConnected ? (
            <span className="wallet-address">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          ) : (
            <span className="connect-wallet-btn" onClick={() => walletManager.connect()}>
              {t('连接钱包')}
            </span>
          )}
        </div>
      </div>

      <div className="bot-content">
        <div className="network-balance-section">
          <div className="network-selector">
            <div className="network-dropdown">
              <div 
                className="network-selected"
                onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              >
                <div className="network-dot"></div>
                <span>{currentNetwork.toUpperCase()} Chain</span>
                <span className="dropdown-arrow">{showNetworkDropdown ? '▲' : '▼'}</span>
              </div>
              {showNetworkDropdown && (
                <div className="network-options">
                  {Object.keys(NETWORKS).map((network) => (
                    <div 
                      key={network} 
                      className={`network-option ${currentNetwork === network ? 'active' : ''}`}
                      onClick={() => {
                        if (walletManager.switchNetwork(network)) {
                          setCurrentNetwork(network);
                          setShowNetworkDropdown(false);
                        }
                      }}
                    >
                      <div className="network-dot"></div>
                      <span>{network.toUpperCase()} Chain</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="balance-info">
            <span className="balance-label">{t('余额')}</span>
            <span className="balance-amount">{balance} {NETWORKS[currentNetwork].nativeToken}</span>
          </div>
        </div>

        <div className="token-input-section">
          <div className="contract-input">
            <input
              type="text"
              value={tokenAddress}
              onChange={handleTokenAddressChange}
              placeholder={t('合约地址')}
              className="contract-address-input"
            />
            <button 
              className="load-button" 
              onClick={loadTokenInfo}
              disabled={loadingPrice}
            >
              {loadingPrice ? t('加载中...') : t('加载')}
            </button>
          </div>
        </div>

        {tokenDetail && (
          <div className="token-info-section">
            <div className="token-header">
              <div className="token-name-section">
                <div className="token-symbol">{tokenDetail.symbol}</div>
                <div className="token-full-name">{tokenDetail.name}</div>
              </div>
            </div>
            
            <div className="token-price-section">
              <div className="price-value">
                ${tokenDetail.price && tokenDetail.price.current ? tokenDetail.price.current.toFixed(8) : '0.00000000'}
              </div>
              <div className={`price-change ${tokenDetail.price && tokenDetail.price.change24h >= 0 ? 'positive' : 'negative'}`}>
                {tokenDetail.price && tokenDetail.price.change24h >= 0 ? '+' : ''}{tokenDetail.price?.change24h?.toFixed(2) || '0.00'}%
              </div>
            </div>
            
            <div className="token-stats-section">
              <div className="stat-item">
                <div className="stat-label">{t('流动性')}</div>
                <div className="stat-value">
                  ${tokenDetail.liquidity && Array.isArray(tokenDetail.liquidity) && tokenDetail.liquidity.length > 0 
                    ? tokenDetail.liquidity.reduce((sum, item) => sum + (item.liquidity || 0), 0).toFixed(2)
                    : '0.00'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">{t('市值')}</div>
                <div className="stat-value">$2,858,497</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">{t('持有')}</div>
                <div className="stat-value">0.0000</div>
              </div>
            </div>
          </div>
        )}

        <div className="anti-rug-section">
          <div className="anti-rug-header">
            <span className="anti-rug-title">🛡️ {t('防夹模式')}</span>
            <label className="anti-rug-switch">
              <input 
                type="checkbox" 
                checked={antiRugMode} 
                onChange={(e) => setAntiRugMode(e.target.checked)}
              />
              <span className="anti-rug-slider"></span>
            </label>
          </div>
          
          {tokenAddress && ethers.isAddress(tokenAddress) && (
            <button 
              className="check-rug-button"
              onClick={() => checkRugPull(tokenAddress, currentNetwork)}
              disabled={checkingRug}
            >
              {checkingRug ? t('检测中...') : `🔍 ${t('安全检测')}`}
            </button>
          )}
          
          {rugCheckResult && (
            <div className={`rug-check-result ${rugCheckResult.riskLevel}`}>
              <div className="risk-level">
                {t('风险等级')}: 
                <span className={`risk-badge ${rugCheckResult.riskLevel}`}>
                  {rugCheckResult.riskLevel === 'high' ? `🔴 ${t('高风险')}` : 
                   rugCheckResult.riskLevel === 'medium' ? `🟡 ${t('中风险')}` : 
                   rugCheckResult.riskLevel === 'low' ? `🟢 ${t('低风险')}` : `⚪ ${t('未知')}`}
                </span>
              </div>
              
              {rugCheckResult.warnings.length > 0 && (
                <div className="warnings-section">
                  <div className="warnings-title">{t('警告')}:</div>
                  {rugCheckResult.warnings.map((warning, index) => (
                    <div key={index} className="warning-item">{warning}</div>
                  ))}
                </div>
              )}
              
              {rugCheckResult.infos.length > 0 && (
                <div className="infos-section">
                  <div className="infos-title">{t('信息')}:</div>
                  {rugCheckResult.infos.map((info, index) => (
                    <div key={index} className="info-item">{info}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {tokenDetail && (
          <div className="trade-section">
            <div className="buy-section">
              <div className="section-header">
                <span className="section-title">{t('买入')} {tokenDetail.symbol}</span>
                <span className="section-arrow">↗</span>
              </div>
              
              <div className="amount-buttons">
                {buyAmounts.map((buyAmount) => (
                  <button 
                    key={buyAmount}
                    className={`amount-button ${amount === buyAmount ? 'active' : ''}`}
                    onClick={() => selectBuyAmount(buyAmount)}
                  >
                    {buyAmount}
                  </button>
                ))}
              </div>
              
              <div className="amount-input">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="amount-input-field"
                />
                <span className="amount-currency">{NETWORKS[currentNetwork].nativeToken}</span>
              </div>
              
              <button 
                className="buy-button" 
                onClick={handleBuy}
                disabled={loading}
              >
                {loading ? t('处理中...') : t('买入')}
              </button>
            </div>

            <div className="sell-section">
              <div className="section-header">
                <span className="section-title">{t('卖出')} {tokenDetail.symbol}</span>
                <span className="section-arrow">↘</span>
              </div>
              
              <div className="percentage-buttons">
                {sellPercentages.map((percentage) => (
                  <button 
                    key={percentage}
                    className={`percentage-button ${sellPercentage === percentage ? 'active' : ''}`}
                    onClick={() => selectSellPercentage(percentage)}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
              
              <div className="amount-input">
                <input
                  type="text"
                  value={sellPercentage}
                  onChange={(e) => setSellPercentage(parseFloat(e.target.value) || 0)}
                  placeholder="100"
                  className="amount-input-field"
                />
                <span className="amount-currency">%</span>
              </div>
              
              <button 
                className="sell-button" 
                onClick={handleSell}
                disabled={loading}
              >
                {loading ? t('处理中...') : t('卖出')}
              </button>
            </div>
          </div>
        )}

        <div className="bot-section">
          <h3>{t('指令终端')}</h3>
          <div className="command-terminal">
            <div className="command-history">
              {commandHistory.length === 0 ? (
                <div className="no-commands">{t('暂无指令历史')}</div>
              ) : (
                commandHistory.map((cmd, index) => (
                  <div key={index} className="command-item">
                    <span className="command-prompt">$</span>
                    <span className="command-text">{cmd.command}</span>
                    <span className="command-time">{cmd.timestamp}</span>
                  </div>
                ))
              )}
            </div>
            <div className="command-input-wrapper">
              <span className="command-prompt">$</span>
              <input
                type="text"
                className="command-input"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && commandInput.trim() && executeCommand(commandInput)}
                placeholder={t('输入指令 (输入 /help 查看帮助)')}
                disabled={loading}
              />
              <button 
                className="command-send-btn"
                onClick={() => commandInput.trim() && executeCommand(commandInput)}
                disabled={loading || !commandInput.trim()}
              >
                {t('发送')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="bot-error">{error}</div>}
      {success && <div className="bot-success">{success}</div>}
    </div>
  );
};

export default Bot;