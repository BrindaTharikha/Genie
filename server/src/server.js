const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access via: http://localhost:${PORT}`);
});