import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors())
app.use(bodyParser.json());

// MySQL connection setup
const pool = mysql.createPool({
  host: 'localhost',  // Change to your MySQL host
  user: 'root',       // MySQL username
  password: 'n3u3da!',       // MySQL password
  database: 'project', // Your MySQL database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to query MySQL
function queryDatabase(query, params = []) {
  return new Promise((resolve, reject) => {
    pool.execute(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}


// app.get('/api/search/:query', (req, res) => {
//     const q = req.params.query.toUpperCase();
//     res.json([
//       { symbol: q, type: 'stock', name: `${q} Corp`, exchange: 'NYSE', currency: 'USD' }
//     ]);
//   });

// GET /api/search/:query
app.get('/api/search/:query', async (req, res) => {
    const queryStr = req.params.query;
  
    try {
      // search by symbol or name, case-insensitive
      const results = await queryDatabase(
        `SELECT symbol, name, type, exchange, currency
         FROM assets
         WHERE symbol LIKE ? OR name LIKE ?
         LIMIT 20`,
        [`%${queryStr}%`, `%${queryStr}%`]
      );
  
      res.json(results);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error searching assets' });
    }
  });
  
  // Dummy quote endpoint
//   app.get('/api/quote/:symbol', (req, res) => {
//     const price = (Math.random() * 200 + 50).toFixed(2);
//     res.json({ symbol: req.params.symbol, price: parseFloat(price), currency: 'USD' });
//   });

// GET /api/quote/:symbol
app.get('/api/quote/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    try {
      const rows = await queryDatabase(
        'SELECT symbol, price, currency FROM assets WHERE symbol = ?',
        [symbol]
      );
  
      if (!rows.length) {
        return res.status(404).json({ error: 'Symbol not found' });
      }
  
      res.json(rows[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  
// API to fetch settlement account balance for a user
app.get('/api/settlement/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await queryDatabase('SELECT balance FROM settlement_account WHERE user_id = ?', [userId]);
    if (result.length === 0) return res.json({ balance: 0 });
    res.json({ balance: Number(result[0].balance) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/settlement/:userId', async (req, res) => {
    const { userId } = req.params;
    const { balance } = req.body;
    try {
      await queryDatabase(
        'INSERT INTO settlement_account (user_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = VALUES(balance)',
        [userId, balance]
      );
      res.json({ message: 'Balance updated' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/transactions/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const results = await queryDatabase(
        'SELECT id, user_id, symbol, type, asset_type, quantity, price, created_at as timestamp FROM transactions WHERE user_id = ? ORDER BY id DESC',
        [userId]
      );
      res.json(results);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

//   app.post('/api/transactions', async (req, res) => {
//     const { user_id, symbol, quantity, type, asset_type } = req.body;
//     const price = Math.random() * 200 + 50; // dummy price
//     const total = price * quantity;
  
//     try {
//       if (type === 'buy') {
//         const result = await queryDatabase('SELECT balance FROM settlement_account WHERE user_id = ?', [user_id]);
//         const bal = result.length ? result[0].balance : 0;
//         if (bal < total) return res.status(400).json({ error: 'Insufficient balance' });
//         await queryDatabase('UPDATE settlement_account SET balance = balance - ? WHERE user_id = ?', [total, user_id]);
//       } else {
//         await queryDatabase('UPDATE settlement_account SET balance = balance + ? WHERE user_id = ?', [total, user_id]);
//       }
  
//       await queryDatabase(
//         'INSERT INTO transactions (user_id, symbol, type, asset_type, quantity, price, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
//         [user_id, symbol, type, asset_type, quantity, price, total]
//       );
//       res.json({ message: 'Transaction successful', price });
//     } catch (e) {
//       console.error(e);
//       res.status(500).json({ error: 'Server error' });
//     }
// });

app.post('/api/transactions', async (req, res) => {
    const { user_id, symbol, quantity, type, asset_type } = req.body;
  
    try {
      // 1. Fetch the current price of the asset from the `assets` table
      const priceResult = await queryDatabase(
        'SELECT price FROM assets WHERE symbol = ?',
        [symbol]
      );
  
      if (priceResult.length === 0) {
        return res.status(404).json({ error: 'Symbol not found in assets table' });
      }
  
      const price = priceResult[0].price;
      const total = price * quantity;
  
      // 2. Handle balance updates for BUY or SELL
      if (type === 'buy') {
        const result = await queryDatabase(
          'SELECT balance FROM settlement_account WHERE user_id = ?',
          [user_id]
        );
        const bal = result.length ? result[0].balance : 0;
  
        if (bal < total) {
          return res.status(400).json({ error: 'Insufficient balance' });
        }
  
        await queryDatabase(
          'UPDATE settlement_account SET balance = balance - ? WHERE user_id = ?',
          [total, user_id]
        );
      } else if (type === 'sell') {
        await queryDatabase(
          'UPDATE settlement_account SET balance = balance + ? WHERE user_id = ?',
          [total, user_id]
        );
      } else {
        return res.status(400).json({ error: 'Invalid transaction type' });
      }
  
      // 3. Store the transaction
      await queryDatabase(
        `INSERT INTO transactions
         (user_id, symbol, type, asset_type, quantity, price, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, symbol, type, asset_type, quantity, price, total]
      );
  
      // 4. Return success response
      res.json({
        message: 'Transaction successful',
        price,
        total,
      });
    } catch (e) {
      console.error('Transaction error:', e);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

app.delete('/api/transactions/:id', async (req, res) => {
    try {
      await queryDatabase('DELETE FROM transactions WHERE id = ?', [req.params.id]);
      res.json({ message: 'Deleted' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/erase', async (_req, res) => {
    try {
      await queryDatabase('TRUNCATE TABLE transactions');
      await queryDatabase('UPDATE settlement_account SET balance=0');
      res.json({ message: 'All data erased' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

// GET /api/portfolio/:userId
app.get('/api/portfolio/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      // fetch all transactions of the user
      const txs = await queryDatabase('SELECT symbol, asset_type, quantity, price, type FROM transactions WHERE user_id = ?', [userId]);
  
      const map = {}; 
      txs.forEach(t => {
        if (!map[t.symbol]) {
          map[t.symbol] = { symbol: t.symbol, asset_type: t.asset_type, quantity: 0, price: t.price };
        }
        if (t.type === 'buy') {
          map[t.symbol].quantity += t.quantity;
        } else {
          map[t.symbol].quantity -= t.quantity;
        }
        // keep latest price
        map[t.symbol].price = t.price;
      });
  
      // convert to array
      const holdings = Object.values(map).filter(h => h.quantity > 0);
      let total_value = 0;
      let diversification = { stocks: 0, bonds: 0, mutual_funds: 0 };
  
      holdings.forEach(h => {
        h.value = h.quantity * h.price;
        total_value += h.value;
        // accumulate by asset_type for pie chart
        if (h.asset_type === 'stock') diversification.stocks += h.value;
        if (h.asset_type === 'bond') diversification.bonds += h.value;
        if (h.asset_type === 'mutual_fund') diversification.mutual_funds += h.value;
      });
  
      res.json({
        holdings,
        total_value,
        diversification
      });
  
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });


// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
