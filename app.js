import express from "express";
import mysql2 from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
}).promise();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const orders = [];

const PORT = 3002;

// Define a route to test database connection 
app.get('/db-test', async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM ORDERS');
        res.send(orders);
    } catch (err) {
        console.error('Database error:', err);
    }
});

app.get("/", (req, res) => {
	res.render("home");
});

app.post("/submit-order", (req, res) => {
	const order = {
		customer: req.body.name,
		email: req.body.email,
		flavor: req.body.flavor,
		cone: req.body.cone,
		toppings: [].concat(req.body.toppings || []), //prevents type error when a String is passed in instead of an Array
		comment: req.body.comment,
		timestamp: new Date(),
	};
	orders.push(order);
	console.log(orders);
	res.render("confirmation", { order });
});


app.get('/admin', async (req, res) => {

    try {
        const [orders] = await pool.query('SELECT * FROM ORDERS ORDER BY timestamp DESC');
        res.render('admin', { orders });
    } catch (err) {
        console.error('Database error:', err);
		res.status(500).send('Error loading orders: ' + err.message);
    }
});

app.post('/confirm', async (req, res) => {
	try {
		const order = req.body;
		console.log('New order submitted:', order);
		order.toppings = Array.isArray(order.toppings) ? order.toppings.join(", ") : "";
		
		const sql =
		`INSERT INTO ORDERS(customer, email, flavor, cone, toppings)
		VALUES (?, ?, ?, ?, ?);`;
		
		const params = [ order.customer, order.email, order.flavor, order.cone, order.toppings];
		const [result] = await pool.execute(sql, params);
		console.log('Order saved with ID:', result.insertId);
		res.render('confirmation', { order });
		} catch (err) {
		console.error('Error saving order:', err);
		res.status(500).send('Sorry, there was an error processing your order. Please try again.');
	}
});
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
