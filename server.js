const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const { readdirSync } = require('fs');
const e = require('express');

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '20mb' }));


// Routes
readdirSync('./routes').map((r) => app.use('/api', require(`./routes/${r}`)));

app.listen(4900, () => {
    console.log('Server is running on http://localhost:4900');
});
