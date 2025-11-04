import express from "express";

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const orders = [];

const PORT = 3002;

app.get("/", (req, res) => {
	res.render("home");
});

app.post("/submit-order", (req, res) => {
	const order = {
		name: req.body.name,
		email: req.body.email,
		flavor: req.body.flavor,
		size: req.body.cone,
		toppings: [].concat(req.body.toppings || []), //prevents type error when a String is passed in instead of an Array
		comment: req.body.comment,
		timestamp: new Date(),
	};
	orders.push(order);
	console.log(orders);
	res.render("confirmation", { order });
});

app.get("/admin", (req, res) => {
	res.render("admin", { orders });
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
