import express from 'express';
import bodyParser from 'body-parser';
import emailRoutes from './routes/email';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/email', emailRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});