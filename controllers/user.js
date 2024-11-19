const prisma = require('../config/prisma');
exports.listUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                address: true,
                enabled: true,
                updatedAt: true
            }
        });
        res.json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

exports.changeStatus = async (req, res) => {
    try {
        const { id, enabled } = req.body;
        const user = await prisma.user.update({
            where: {
                id: parseInt(id)
            },
            data: {
                enabled: enabled
            }
        });
        res.json({ msg: 'User status updated' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

exports.changeRole = async (req, res) => {
    try {
        const { id, role } = req.body;
        const user = await prisma.user.update({
            where: {
                id: parseInt(id)
            },
            data: {
                role: role
            }
        });
        res.json({ msg: 'User role updated' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}


exports.userCart = async (req, res) => {
    try {
        const { cart } = req.body;
        console.log(cart);
        console.log(req.user.id);

        const user = await prisma.user.findFirst({
            where: {
                id: req.user.id
            }
        });
        // console.log(user);
        //check quantity of product
         for (const item of cart) {
            // console.log(item);
            const product = await prisma.product.findUnique({
                where: {
                    id: item.id
                }
                , select: {
                    quantity: true,
                    title: true
                }
            });

            console.log(item);
            console.log(product);
            if (!product || item.count > product.quantity) {
                return res.status(400).json({ ok: "false", msg: `Product ${product?.title} is out of stock` });
            }
        }
        // delete old cart item
        await prisma.productOnCart.deleteMany({
            where: {
                cart: {
                    orderedById: user.id
                }
            }
        });
        // delete old cart
        await prisma.cart.deleteMany({
            where: {
                orderedById: user.id
            }
        });
        // ready 
        let products = cart.map((item) => ({
            productId: item.id,
            count: item.count,
            price: item.price
        }))
        let cartTotle = products.reduce((acc, item) => acc + item.price * item.count, 0);

        const newCart = await prisma.cart.create({
            data: {
                products: {
                    create: products
                },
                cartTotal: cartTotle,
                orderedById: user.id
            }
        });

        console.log(newCart);
        res.json({ msg: 'add to cart' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}


exports.getUserCart = async (req, res) => {
    try {
        const cart = await prisma.cart.findFirst({
            where: {
                orderedById: req.user.id
            },
            include: {
                products: {
                    include: {
                        product: true
                    }
                }
            }
        });

        res.json({
            products: cart.products,
            cartTotal: cart.cartTotal
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

exports.emptyCart = async (req, res) => {
    try {
        const cart = await prisma.cart.findFirst({
            where: {
                orderedById: req.user.id
            }
        });
        if (!cart) {
            return res.status(400).json({ msg: 'Cart not found' });
        }
        await prisma.productOnCart.deleteMany({
            where: {
                cartId: cart.id
            }
        });
        const result = await prisma.cart.deleteMany({
            where: {
                orderedById: req.user.id
            }
        });



        console.log(result);
        res.json({
            msg: 'Cart empty',
            deletedCoute: result.count
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}


exports.saveAddress = async (req, res) => {
    try {
        const { address } = req.body;
        console.log(address);
        const addAddressuser = await prisma.user.update({
            where: {
                id: req.user.id
            },
            data: {
                address: address
            }
        });



        res.json({ ok: true, msg: 'Address updated' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}


exports.saveOrder = async (req, res) => {
    try {
        // console.log(req.body);
        // return res.json({ ok: "true", msg: 'hello' });
        const { id,amount,status,currency } = req.body.paymentIntent;


        //get user cart
        const userCart = await prisma.cart.findFirst({
            where: {
                orderedById: req.user.id
            },
            include: {
                products: true
            }
        });
        // check cart is empty cant save order
        if (!userCart || userCart.products.length === 0) {
            return res.status(400).json({ ok: "false", msg: 'Cart is Empty' });
        }
        // check quantity of product
        // for (const item of userCart.products) {
        //     // console.log(item);
        //     const product = await prisma.product.findUnique({
        //         where: {
        //             id: item.productId
        //         }
        //         , select: {
        //             quantity: true,
        //             title: true
        //         }
        //     });

        //     console.log(item);
        //     console.log(product);
        //     if (!product || item.count > product.quantity) {
        //         return res.status(400).json({ ok: "false", msg: `Product ${product.title} is out of stock` });
        //     }
        // }
        const amountTHB = Number(amount) / 100;
        // Create a New Order
        const order = await prisma.order.create({
            data: {
                products: {
                    create: userCart.products.map((item) => ({
                        productId: item.productId,
                        count: item.count,
                        price: item.price
                    }))
                },
                orderedById: req.user.id,
                cartTotal: userCart.cartTotal,
                stripePaymentId: id,
                amount: Number(amountTHB),
                status: status,
                currency: currency
            }
        })

        // update product quantity
        const update = userCart.products.map((item) => ({
            where: { id: item.productId },
            data: {
                quantity: { decrement: item.count },
                sold: { increment: item.count }
            }
        }))
        console.log(update)

        await Promise.all(
            update.map((updated) => prisma.product.update(updated))
        )

        // delete cart
        await prisma.cart.deleteMany({
            where: {
                orderedById: req.user.id
            }
        });

        // console.log(userCart);
        res.json({ ok: "true", msg: order });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}


exports.getOrder = async (req, res) => {
    try {

        const orders = await prisma.order.findMany({
            where: {
                orderedById: req.user.id
            },
            include: {
                products: {
                    include: {
                        product: true
                    }
                }
            }
        });
        if (orders.length === 0) {
            return res.status(400).json({ok:false, msg: 'Order not found' });
        }
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}