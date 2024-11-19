const prisma = require('../config/prisma');
const stripe = require("stripe")('sk_test_51QDglxLBpPoBWH0Da5a0FEahXh2QPlgrlwnPH7AWiXTuhpGxMTrPz5wBbKUQJLDn32IiOe7INOoX3xdQXdhgYplf007pOzMdrd');
exports.payment = async (req, res) => {
    try {
        const cart = await prisma.cart.findFirst({
            where: {
                orderedById: req.user.id
            },
        });
        // console.log(cart);
        const amountTHB = cart.cartTotal * 100;

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountTHB,
            currency: "thb",
            // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
            automatic_payment_methods: {
                enabled: true,
            },
        });
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}