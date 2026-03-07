/**
 * AggieQuant Trading Competition Simulator
 * Handles the simulated market data, order book generation, and local order execution.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const state = {
        cash: 100000.00,
        positions: {}, // { assetKey: { qty, avgPrice, realizedPnL } }
        workingOrders: [], // { id, side, type, price, qty, asset }
        currentAsset: 'AQ_IDX',
        marketData: {
            'AQ_IDX': { price: 100.00, volatility: 0.05, drift: 0.001 },
            'FUT_DEC': { price: 102.50, volatility: 0.08, drift: 0.005 },
            'OPT_CALL': { price: 5.20, volatility: 0.2, drift: -0.01 }
        },
        orderBook: { asks: [], bids: [] }
    };

    // --- DOM Elements ---
    const ui = {
        cashBalance: document.getElementById('cash-balance'),
        openPnl: document.getElementById('open-pnl'),
        realizedPnl: document.getElementById('realized-pnl'),
        instrumentBtns: document.querySelectorAll('.instrument-btn'),
        tickerSymbol: document.querySelector('.ticker-symbol'),
        lastPrice: document.getElementById('last-price'),
        priceChange: document.getElementById('price-change'),
        obAsks: document.getElementById('ob-asks-container'),
        obBids: document.getElementById('ob-bids-container'),
        midPrice: document.getElementById('mid-price-display'),
        currentSpread: document.getElementById('current-spread'),
        orderTabs: document.querySelectorAll('.order-tab'),
        orderQty: document.getElementById('order-qty'),
        orderPrice: document.getElementById('order-price'),
        priceInputGroup: document.getElementById('price-input-group'),
        estValue: document.getElementById('est-order-value'),
        btnBuy: document.getElementById('btn-buy'),
        btnSell: document.getElementById('btn-sell'),
        positionsTable: document.getElementById('positions-table-body'),
        workingOrdersTable: document.getElementById('working-orders-body'),
        activityLog: document.getElementById('activity-log'),
        btnCancelAll: document.getElementById('btn-cancel-all')
    };

    let activeOrderType = 'limit';
    let simulationInterval = null;

    // --- Format Utils ---
    const fmtCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    const fmtNum = (val, dec = 2) => val.toFixed(dec);

    // --- Core Simulation Logic ---
    function initSimulation() {
        logActivity('System initialized. Connecting to simulated matching engine...', 'system');
        setTimeout(() => {
            logActivity('Connected. Feed active.', 'success');
            // Start the market tick loop (updates price every 1s)
            simulationInterval = setInterval(tickMarket, 1000);
            updateUI();
        }, 1500);
    }

    function tickMarket() {
        // Random walk for current asset
        const asset = state.marketData[state.currentAsset];
        const oldPrice = asset.price;

        // GBM step roughly
        const shock = (Math.random() - 0.5) * 2; // -1 to 1
        const change = asset.price * (asset.drift / 252 + asset.volatility * shock / Math.sqrt(252));
        asset.price = Math.max(0.01, asset.price + change); // Prevent negative prices

        generateOrderBook(asset.price);
        checkWorkingOrders();
        updateMarketUI(oldPrice);
        updatePositionsUI();
    }

    function generateOrderBook(midPrice) {
        state.orderBook.asks = [];
        state.orderBook.bids = [];
        const spread = midPrice * 0.001; // 0.1% spread roughly

        let currentAsk = midPrice + (spread / 2);
        let currentBid = midPrice - (spread / 2);

        for (let i = 0; i < 5; i++) {
            // Asks go up
            currentAsk += (Math.random() * 0.05);
            state.orderBook.asks.push({ price: currentAsk, size: Math.floor(Math.random() * 500) + 10 });

            // Bids go down
            currentBid -= (Math.random() * 0.05);
            state.orderBook.bids.push({ price: currentBid, size: Math.floor(Math.random() * 500) + 10 });
        }

        // Re-sort to display highest ask at top, lowest bid at bottom
        state.orderBook.asks.sort((a, b) => b.price - a.price);
        state.orderBook.bids.sort((a, b) => b.price - a.price); // Actually we want highest bid at top
    }

    function checkWorkingOrders() {
        const currentPrice = state.marketData[state.currentAsset].price;
        const executed = [];

        state.workingOrders.forEach(order => {
            if (order.asset !== state.currentAsset) return; // Only process orders for active asset for simplicity

            let didExecute = false;
            // Best effort matching against mid price
            if (order.side === 'buy' && order.price >= currentPrice) didExecute = true;
            if (order.side === 'sell' && order.price <= currentPrice) didExecute = true;

            if (didExecute) {
                executeTrade(order.asset, order.side, order.qty, order.price); // Exec at limit price for simplicity
                executed.push(order.id);
                logActivity(`Limit ${order.side.toUpperCase()} filled for ${order.qty} ${order.asset} @ ${fmtNum(order.price)}`, 'success');
            }
        });

        if (executed.length > 0) {
            state.workingOrders = state.workingOrders.filter(o => !executed.includes(o.id));
            updateWorkingOrdersUI();
        }
    }

    function executeTrade(assetKey, side, qty, execPrice) {
        qty = parseInt(qty);
        const notional = qty * execPrice;

        // Update cash
        if (side === 'buy') state.cash -= notional;
        if (side === 'sell') state.cash += notional;

        // Update positions
        if (!state.positions[assetKey]) {
            state.positions[assetKey] = { qty: 0, avgPrice: 0, realizedPnL: 0 };
        }

        const pos = state.positions[assetKey];
        const oldQty = pos.qty;

        // PnL calc if closing
        if ((oldQty > 0 && side === 'sell') || (oldQty < 0 && side === 'buy')) {
            // Closing out some or all
            const closeQty = Math.min(Math.abs(oldQty), qty);
            const pnlPerShare = side === 'sell' ? (execPrice - pos.avgPrice) : (pos.avgPrice - execPrice);
            pos.realizedPnL += closeQty * pnlPerShare;
        }

        // New avg price if adding to position
        if ((oldQty >= 0 && side === 'buy') || (oldQty <= 0 && side === 'sell')) {
            const currentNotionalAbs = Math.abs(oldQty) * pos.avgPrice;
            const newNotionalAbs = currentNotionalAbs + notional;
            const newTotalQty = Math.abs(oldQty) + qty;
            pos.avgPrice = newNotionalAbs / newTotalQty;
        }

        // Update net qty
        pos.qty += side === 'buy' ? qty : -qty;

        // Clean up flat positions
        if (pos.qty === 0) pos.avgPrice = 0;

        updatePositionsUI();
        updatePortfolioUI();
    }

    function submitOrder(side) {
        const qty = parseInt(ui.orderQty.value);
        if (isNaN(qty) || qty <= 0) return alert('Invalid Quantity');

        const currentPrice = state.marketData[state.currentAsset].price;

        if (activeOrderType === 'market') {
            // Simulate slippage by taking best bid/ask
            const spread = currentPrice * 0.001;
            const execPrice = side === 'buy' ? currentPrice + (spread / 2) : currentPrice - (spread / 2);
            executeTrade(state.currentAsset, side, qty, execPrice);
            logActivity(`Market ${side.toUpperCase()} filled for ${qty} ${state.currentAsset} @ ${fmtNum(execPrice)}`, 'success');
        } else {
            const price = parseFloat(ui.orderPrice.value);
            if (isNaN(price) || price <= 0) return alert('Invalid Price');

            const orderId = 'ORD-' + Math.floor(Math.random() * 100000);
            state.workingOrders.push({
                id: orderId,
                side,
                type: 'limit',
                price,
                qty,
                asset: state.currentAsset
            });
            logActivity(`Submitted Limit ${side.toUpperCase()} for ${qty} ${state.currentAsset} @ ${fmtNum(price)}`, 'info');
            updateWorkingOrdersUI();
        }
    }

    // --- UI Update Methods ---
    function updateUI() {
        updateMarketUI(state.marketData[state.currentAsset].price);
        updatePositionsUI();
        updatePortfolioUI();
        updateWorkingOrdersUI();
    }

    function updateMarketUI(oldPrice) {
        const asset = state.marketData[state.currentAsset];
        ui.tickerSymbol.textContent = state.currentAsset.replace('_', ' ');
        ui.lastPrice.textContent = fmtNum(asset.price);

        const diff = asset.price - oldPrice;
        const pct = (diff / oldPrice) * 100;

        ui.priceChange.textContent = `${diff >= 0 ? '+' : ''}${fmtNum(diff)} (${diff >= 0 ? '+' : ''}${fmtNum(pct)}%)`;
        ui.priceChange.className = `ticker-change ${diff >= 0 ? 'positive' : 'negative'}`;

        // Flash last price
        ui.lastPrice.classList.remove('flash-green', 'flash-red');
        void ui.lastPrice.offsetWidth; // trigger reflow
        ui.lastPrice.classList.add(diff >= 0 ? 'flash-green' : 'flash-red');

        // Order Book UI
        ui.midPrice.textContent = fmtNum(asset.price);

        if (state.orderBook.asks.length > 0 && state.orderBook.bids.length > 0) {
            const bestAsk = state.orderBook.asks[state.orderBook.asks.length - 1].price;
            const bestBid = state.orderBook.bids[0].price;
            ui.currentSpread.textContent = fmtNum(Math.abs(bestAsk - bestBid), 3);
        }

        renderOrderBook();
        updateOrderValue();
    }

    function renderOrderBook() {
        // Find if we have working orders at these prices
        const myOrders = state.workingOrders.filter(o => o.asset === state.currentAsset);

        ui.obAsks.innerHTML = state.orderBook.asks.map(ask => `
            <div class="ob-row ask-row">
                <span class="ob-size">${ask.size}</span>
                <span class="ob-price negative">${fmtNum(ask.price)}</span>
                <span class="ob-my-size">${myOrders.filter(o => o.side === 'sell' && Math.abs(o.price - ask.price) < 0.05).reduce((sum, o) => sum + o.qty, 0) || '-'}</span>
                <div class="depth-bar ask-depth" style="width: ${Math.min(100, ask.size / 10)}%"></div>
            </div>
        `).join('');

        ui.obBids.innerHTML = state.orderBook.bids.map(bid => `
            <div class="ob-row bid-row">
                <span class="ob-size">${bid.size}</span>
                <span class="ob-price positive">${fmtNum(bid.price)}</span>
                <span class="ob-my-size">${myOrders.filter(o => o.side === 'buy' && Math.abs(o.price - bid.price) < 0.05).reduce((sum, o) => sum + o.qty, 0) || '-'}</span>
                <div class="depth-bar bid-depth" style="width: ${Math.min(100, bid.size / 10)}%"></div>
            </div>
        `).join('');
    }

    function updatePositionsUI() {
        const tbody = ui.positionsTable;
        let html = '';
        let totalUnrealized = 0;
        let totalRealized = 0;

        for (const [asset, pos] of Object.entries(state.positions)) {
            totalRealized += pos.realizedPnL;
            if (pos.qty === 0 && pos.realizedPnL === 0) continue;

            const currentPrice = state.marketData[asset].price;
            const unrealized = pos.qty !== 0 ? (pos.qty > 0 ? (currentPrice - pos.avgPrice) * pos.qty : (pos.avgPrice - currentPrice) * Math.abs(pos.qty)) : 0;
            totalUnrealized += unrealized;

            if (pos.qty !== 0) {
                const uColor = unrealized >= 0 ? 'positive' : 'negative';
                html += `
                    <tr>
                        <td><strong>${asset.replace('_', ' ')}</strong></td>
                        <td class="${pos.qty > 0 ? 'positive' : 'negative'}">${pos.qty > 0 ? '+' : ''}${pos.qty}</td>
                        <td>${fmtNum(pos.avgPrice)}</td>
                        <td>${fmtNum(currentPrice)}</td>
                        <td class="${uColor}">${unrealized >= 0 ? '+' : ''}${fmtCurrency(unrealized)}</td>
                    </tr>
                `;
            }
        }

        if (html === '') {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No active positions</td></tr>';
        } else {
            tbody.innerHTML = html;
        }

        state.openPnL = totalUnrealized;
        state.totalRealized = totalRealized;
        updatePortfolioUI();
    }

    function updatePortfolioUI() {
        ui.cashBalance.textContent = fmtCurrency(state.cash);

        ui.openPnl.textContent = state.openPnL >= 0 ? '+' + fmtCurrency(state.openPnL || 0) : fmtCurrency(state.openPnL || 0);
        ui.openPnl.className = `summary-value ${state.openPnL >= 0 ? 'positive' : 'negative'}`;

        ui.realizedPnl.textContent = state.totalRealized >= 0 ? '+' + fmtCurrency(state.totalRealized || 0) : fmtCurrency(state.totalRealized || 0);
        ui.realizedPnl.className = `summary-value ${state.totalRealized >= 0 ? 'positive' : (state.totalRealized < 0 ? 'negative' : 'neutral')}`;
    }

    function updateWorkingOrdersUI() {
        const tbody = ui.workingOrdersTable;
        if (state.workingOrders.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No working orders</td></tr>';
            return;
        }

        tbody.innerHTML = state.workingOrders.map(o => `
            <tr>
                <td class="${o.side === 'buy' ? 'positive' : 'negative'} text-upper"><strong>${o.side}</strong> ${o.asset}</td>
                <td>${fmtNum(o.price)}</td>
                <td>${o.qty}</td>
                <td><button class="btn-cancel" onclick="cancelOrder('${o.id}')"><i class="fa-solid fa-xmark"></i></button></td>
            </tr>
        `).join('');
    }

    window.cancelOrder = function (id) {
        state.workingOrders = state.workingOrders.filter(o => o.id !== id);
        logActivity(`Order ${id} cancelled.`, 'info');
        updateWorkingOrdersUI();
        renderOrderBook();
    };

    function updateOrderValue() {
        const qty = parseInt(ui.orderQty.value) || 0;
        let price = parseFloat(ui.orderPrice.value) || 0;
        if (activeOrderType === 'market') {
            price = state.marketData[state.currentAsset].price;
        }
        ui.estValue.textContent = fmtCurrency(qty * price);
    }

    function logActivity(msg, type = 'info') {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="log-time">${time}</span> ${msg}`;
        ui.activityLog.prepend(entry); // Add to top
        if (ui.activityLog.children.length > 50) {
            ui.activityLog.removeChild(ui.activityLog.lastChild);
        }
    }

    // --- Event Listeners ---
    ui.instrumentBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            ui.instrumentBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentAsset = e.target.dataset.asset;
            ui.orderPrice.value = fmtNum(state.marketData[state.currentAsset].price);
            updateMarketUI(state.marketData[state.currentAsset].price);
            renderOrderBook();
        });
    });

    ui.orderTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            ui.orderTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            activeOrderType = e.target.dataset.type;

            if (activeOrderType === 'market') {
                ui.priceInputGroup.style.opacity = '0.5';
                ui.orderPrice.disabled = true;
                ui.orderPrice.value = 'MKT';
            } else {
                ui.priceInputGroup.style.opacity = '1';
                ui.orderPrice.disabled = false;
                ui.orderPrice.value = fmtNum(state.marketData[state.currentAsset].price);
            }
            updateOrderValue();
        });
    });

    ui.orderQty.addEventListener('input', updateOrderValue);
    ui.orderPrice.addEventListener('input', updateOrderValue);

    ui.btnBuy.addEventListener('click', () => submitOrder('buy'));
    ui.btnSell.addEventListener('click', () => submitOrder('sell'));

    ui.btnCancelAll.addEventListener('click', () => {
        if (state.workingOrders.length > 0) {
            state.workingOrders = [];
            logActivity('All working orders cancelled.', 'info');
            updateWorkingOrdersUI();
            renderOrderBook();
        }
    });

    // Start Simulation
    initSimulation();
});
