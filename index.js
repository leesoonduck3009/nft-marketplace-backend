const express = require('express')
const app = express();
require('dotenv').config();
const Moralis = require ('moralis').default;
const {listenMakeItem, listenBoughtItem} = require('./controller/MarkeplaceController')
const port = process.env.PORT ?? 8080;
app.use(express.json());

app.use('/api/marketplace',require('./routes/MarketplaceRoute'));
app.use('/api/private-key',require('./routes/PrivateKeyRoute'));
app.use('/api/wallet',require('./routes/WallerRoute'));
app.use('/api/nft',require('./routes/NFTRoute'));

app.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
  });
const startServer = async () => {
    await Moralis.start({
      apiKey: process.env.API,
    });
  
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  };
  listenMakeItem();
  listenBoughtItem();
  startServer();