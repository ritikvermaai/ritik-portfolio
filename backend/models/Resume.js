// Resume is currently stored inside PortfolioContent for backward compatibility.
// This alias lets controllers/services address the Resume domain separately
// without migrating or duplicating the existing document.
module.exports = require('./PortfolioContent');
