

module.exports = function(date) {
    const options = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      };
      const formattedDate = new Intl.DateTimeFormat('en-US', options).format(new Date(date));
      return formattedDate;
   }
 
 