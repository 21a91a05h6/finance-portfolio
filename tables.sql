-- settlement_account table
CREATE TABLE settlement_account (
    user_id VARCHAR(50) PRIMARY KEY,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- transactions table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    type ENUM('buy', 'sell') NOT NULL,
    asset_type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insert sample users into settlement_account
INSERT INTO settlement_account (user_id, balance, currency) VALUES
  ('user123', 10000.00, 'USD'),
  ('user456', 5000.00, 'USD'),
  ('user789', 2500.00, 'USD');

-- Insert sample transactions for these users
INSERT INTO transactions (user_id, symbol, type, asset_type, quantity, price, total_amount) VALUES
  ('user123', 'AAPL', 'buy',  'stock',  10, 150.00, 1500.00),
  ('user123', 'TSLA', 'sell', 'stock',   5, 700.00, 3500.00),
  ('user456', 'GOOGL', 'buy', 'stock',   8, 1200.00, 9600.00),
  ('user456', 'BND',  'buy',  'bond',   15, 90.00,  1350.00),
  ('user789', 'VFIAX', 'buy', 'mutual_fund', 20, 400.00, 8000.00),
  ('user789', 'MSFT', 'sell','stock',    5, 300.00, 1500.00);
  
  select * from settlement_account;
  
  select * from transactions;
  
  CREATE TABLE assets (
    symbol VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50),
    type VARCHAR(20),
    exchange VARCHAR(10),
    currency VARCHAR(10)
);

INSERT INTO assets (symbol, name, type, exchange, currency) VALUES
  ('AAPL', 'Apple Inc.', 'stock', 'NASDAQ', 'USD'),
  ('MSFT', 'Microsoft Corporation', 'stock', 'NASDAQ', 'USD'),
  ('GOOGL', 'Alphabet Inc.', 'stock', 'NASDAQ', 'USD'),
  ('AMZN', 'Amazon.com Inc.', 'stock', 'NASDAQ', 'USD'),
  ('TSLA', 'Tesla Inc.', 'stock', 'NASDAQ', 'USD'),

  ('US10Y', 'US 10YR Treasury Note', 'bond', 'NYSE', 'USD'),
  ('BND', 'Vanguard Total Bond Market', 'bond', 'NYSE', 'USD'),

  ('VFIAX', 'Vanguard 500 Index Fund', 'mutual_fund', 'NYSE', 'USD'),
  ('FXAIX', 'Fidelity 500 Index Fund', 'mutual_fund', 'NYSE', 'USD'),
  ('VTSAX', 'Vanguard Total Stock Market', 'mutual_fund', 'NYSE', 'USD');
  
  ALTER TABLE assets ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
  
  UPDATE assets SET price = 180 WHERE symbol = 'AAPL';
UPDATE assets SET price = 350 WHERE symbol = 'MSFT';
UPDATE assets SET price = 2900 WHERE symbol = 'GOOGL';
UPDATE assets SET price = 3200 WHERE symbol = 'AMZN';
UPDATE assets SET price = 700 WHERE symbol = 'TSLA';
UPDATE assets SET price = 100 WHERE symbol = 'US10Y';
UPDATE assets SET price = 90 WHERE symbol = 'BND';
UPDATE assets SET price = 450 WHERE symbol = 'VFIAX';
UPDATE assets SET price = 160 WHERE symbol = 'FXAIX';
UPDATE assets SET price = 220 WHERE symbol = 'VTSAX';

select * from assets;




