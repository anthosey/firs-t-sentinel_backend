function routesmanager(accountType, route) {
   let companyPrivileges = ['uploaddealbycsv', 'addnegotiateddealbroad', 'negotiateddealsbyowner', 'deletedeal', 'transactionsbyowner'];
   let viewer = [];
   
   
    switch (accountType) {
        case 'company':
            
            let found = companyPrivileges.includes(route);
            if (found) {
                return 'Allow';
            } else return 'Disallow';
            
            break;
        case 'viewer':
            
            break;
        // Add more cases as needed
        case 'admin':
            return 'Allow';
            break;
        // Add more cases as needed
        default:
           return 'Disallow';
    }

}
module.exports = {
    routesmanager
};
