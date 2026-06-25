fetch('https://kashflowvest.onrender.com/index.html')
  .then(r => r.text())
  .then(t => {
    const hasTel = t.includes('type="tel"');
    console.log('HAS TEL:', hasTel);
    console.log(t.substring(t.indexOf('logForm'), t.indexOf('logForm') + 500));
  });
