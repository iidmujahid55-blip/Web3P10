// MetaMask connect demo — request permission, show address, handle changes
const connectButton = document.getElementById('connectButton');
const statusBadge = document.getElementById('statusBadge');
const walletCard = document.getElementById('walletCard');
const walletAddressEl = document.getElementById('walletAddress');
const networkNameEl = document.getElementById('networkName');
const copyBtn = document.getElementById('copyBtn');
const identicon = document.getElementById('identicon');

function setStatus(text, color) {
  statusBadge.textContent = text;
  statusBadge.className = 'status ' + (color || '');
}

function truncate(address) {
  if (!address) return '—';
  return address.slice(0, 6) + '…' + address.slice(-4);
}

function shortNetwork(chainId) {
  const map = {
    '0x1': 'Ethereum Mainnet',
    '0x3': 'Ropsten',
    '0x4': 'Rinkeby',
    '0x5': 'Goerli',
    '0x2a': 'Kovan',
    '0x38': 'BSC',
    '0x89': 'Polygon'
  };
  return map[chainId] || chainId || 'Unknown';
}

function explorerBase(chainId) {
  const map = {
    '0x1': 'https://etherscan.io/address/',
    '0x3': 'https://ropsten.etherscan.io/address/',
    '0x4': 'https://rinkeby.etherscan.io/address/',
    '0x5': 'https://goerli.etherscan.io/address/',
    '0x38': 'https://bscscan.com/address/',
    '0x89': 'https://polygonscan.com/address/'
  };
  return map[chainId] || map['0x1'];
}

async function connectWallet() {
  if (!window.ethereum) {
    setStatus('MetaMask not installed', 'error');
    window.open('https://metamask.io/download.html', '_blank');
    return;
  }

  try {
    setStatus('Requesting permission...', 'loading');
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    handleAccounts(accounts);
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    networkNameEl.textContent = shortNetwork(chainId);
    setStatus('Connected', 'success');
    connectButton.textContent = 'Connected';
    connectButton.disabled = true;
  } catch (err) {
    console.error(err);
    if (err && err.code === 4001) {
      setStatus('Permission rejected', 'error');
    } else {
      setStatus('Connection error', 'error');
    }
  }
}

function handleAccounts(accounts) {
  if (accounts && accounts.length > 0) {
    const addr = accounts[0];
    walletAddressEl.textContent = truncate(addr);
    walletAddressEl.title = addr;
    walletCard.classList.remove('hidden');
    renderIdenticon(addr);
    // make address clickable to open block explorer
    walletAddressEl.style.cursor = 'pointer';
    walletAddressEl.onclick = async () => {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const url = explorerBase(chainId) + addr;
        window.open(url, '_blank', 'noopener');
      } catch (e) {
        const url = explorerBase('0x1') + addr;
        window.open(url, '_blank', 'noopener');
      }
    };
  } else {
    walletAddressEl.textContent = '—';
    walletCard.classList.add('hidden');
    setStatus('Disconnected', '');
    connectButton.textContent = 'Connect Wallet';
    connectButton.disabled = false;
  }
}

function renderIdenticon(address) {
  if (!identicon) return;
  // Simple identicon: colored circle based on address hash
  const hash = Array.from(address).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hue = hash % 360;
  identicon.style.background = `linear-gradient(135deg, hsl(${hue} 70% 60%), hsl(${(hue+40)%360} 70% 45%))`;
}

copyBtn && copyBtn.addEventListener('click', async () => {
  try {
    const full = walletAddressEl.title || '';
    if (!full) return;
    await navigator.clipboard.writeText(full);
    setStatus('Address copied', 'success');
    setTimeout(() => setStatus('Connected', 'success'), 1200);
  } catch (e) {
    console.error(e);
    setStatus('Copy failed', 'error');
  }
});

// Listen for account / chain changes
if (window.ethereum) {
  window.ethereum.on && window.ethereum.on('accountsChanged', (accounts) => {
    handleAccounts(accounts);
    if (accounts.length === 0) setStatus('Disconnected', '');
    else setStatus('Connected', 'success');
  });
  window.ethereum.on && window.ethereum.on('chainChanged', (chainId) => {
    networkNameEl.textContent = shortNetwork(chainId);
  });
}

connectButton && connectButton.addEventListener('click', connectWallet);

// On load, try to show already-connected account (no popup)
window.addEventListener('load', async () => {
  if (!window.ethereum) {
    setStatus('MetaMask not available', 'error');
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (accounts && accounts.length > 0) {
      handleAccounts(accounts);
      networkNameEl.textContent = shortNetwork(chainId);
      setStatus('Connected', 'success');
      connectButton.textContent = 'Connected';
      connectButton.disabled = true;
    } else {
      setStatus('Idle', '');
    }
  } catch (e) {
    console.warn(e);
  }
});