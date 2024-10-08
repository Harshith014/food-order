const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const MenuItem = require('../models/menuModel');

// addOrder: Create a new order from the user's cart
exports.addOrder = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find the user's cart
    const cart = await Cart.findOne({ userId }).lean();

    // Check if the cart exists and has items
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Fetch the menu item names
    const menuItemNames = await Promise.all(
      cart.items.map(async (item) => {
        const menuItem = await MenuItem.findById(item.menuItemId);
        return menuItem.name;
      })
    );

    // Create a new order
    const order = new Order({
      userId,
      items: cart.items.map((item, index) => ({
        menuItemId: item.menuItemId,
        name: menuItemNames[index],
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice: cart.totalPrice,
      orderDate: new Date(),
      status: 'confirmed',
    });

    // Save the order
    await order.save();

    // Clear the user's cart
    await Cart.updateOne({ userId }, { $set: { items: [], totalPrice: 0 } });

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};




exports.allOrder = async (req, res) => {
  try {
    const userId = req.params.userId;

    const orders = await Order.find({ userId });

    res.status(200).json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};



// Get order by ID
exports.getOrder = async (req, res) => {
  try {
    const orderId = req.params.id; // assuming the ID is passed as a URL parameter
    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
    } else {
      res.status(200).json({ order });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


