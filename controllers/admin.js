const prisma = require("../config/prisma");

exports.changeOrderStatus = async (req, res) => {
    try {
        //
        const { orderId, orderStatus } = req.body;
        const orderUpdate = await prisma.order.update({
            where: {
                id: orderId,
            },
            data: {
                orderStatus: orderStatus,
            },
        });
        res.json({
            orderUpdate
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

exports.getOrdersAdmin = async (req, res) => {
    try {
        //
        const orders = await prisma.order.findMany({
            include :{
                products : {
                    include : {
                        product : true
                    }
                },
                orderedBy:{
                    select : {
                        email : true,
                        address : true,
                    }
                }
            }
        });
        res.json({ orders });

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server Error' });

    }
}