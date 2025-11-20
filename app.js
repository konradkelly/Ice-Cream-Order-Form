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

app.post("/submit-order", async (req, res) => {
        const order = {
                customer: req.body.name,
                email: req.body.email,
                flavor: req.body.flavor,
                cone: req.body.cone,
                toppings: req.body.toppings,
                timestamp: new Date()
        };

        if (Array.isArray(order.toppings)) {
                order.toppings = order.toppings.join(", ");
        } else if (typeof order.toppings === "string") {
                try {
                        const parsed = JSON.parse(order.toppings);
                        if (Array.isArray(parsed)) {
                                order.toppings = parsed.join(", ");
                        }
                } catch {
                        // not JSON, leave it alone
                }
        }

        const sql = "INSERT INTO ORDERS (customer, email, flavor, cone, toppings, timestamp) VALUES (?, ?, ?, ?, ?, ?)";
        const params = [
                order.customer,
                order.email,
                order.flavor,
                order.cone,
                order.toppings,
                order.timestamp
        ];

        try {
                const [result] = await pool.execute(sql, params);
                res.render('confirmation', { order });
        } catch (err) {
                console.error("Database Error:", err);
                res.status(500).send('Error loading orders: ' + err.message);
        }
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

app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
});
