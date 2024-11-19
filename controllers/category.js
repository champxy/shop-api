const prisma = require('../config/prisma');


exports.create = async (req, res) => {
    try {
        const { name } = req.body;
        const category = await prisma.category.create({
            data: {
                name: name
            }
        });

        res.send(category);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

exports.list = async (req, res) => {
    try {
        const categories = await prisma.category.findMany();
        res.send(categories);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.delete({
            where: {
                id: parseInt(id)
            }
        });
        res.send(category);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}