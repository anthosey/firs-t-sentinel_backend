const dns = require('dns');

// Set DNS servers
// dns.setServers(['8.8.8.8', '8.8.4.4']); // Google's public DNS servers

const domain = 'api.taxpromax.firs.gov.ng'; // Replace with your API domain

dns.lookup(domain, (err, address, family) => {
  if (err) {
    console.error('DNS Lookup failed:', err);
    return;
  }
  console.log(`DNS Lookup for ${domain}: Address: ${address}, Family: ${family}`);
});