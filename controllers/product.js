const prisma = require('../config/prisma');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET

});

exports.create = async (req, res) => {
    try {
        const { title, description, price, quantity, categoryId, images } = req.body;
        //  console.log(title, description, price, quantity, images);
        const product = await prisma.product.create({
            data: {
                title: title,
                description: description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: parseInt(categoryId),
                images: {
                    create: images.map((item) => ({
                        asset_id: item.asset_id,
                        public_id:item.public_id,
                        url: item.url,
                        secure_url: item.secure_url
                    }))
                }
            }
        });
        res.json(product);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

exports.list = async (req, res) => {
    try {
        const { count } = req.params;
        console.log(typeof count);
        const products = await prisma.product.findMany({
            take: parseInt(count),
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                images: true,
                category: true
            }
        });








        res.json(products);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

exports.read = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                images: true,
                category: true
            }
        });
        res.json(product);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}


exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, quantity, categoryId, images } = req.body;

        await prisma.image.deleteMany({
            where: {
                productId: parseInt(id)
            }
        });

        const updateproduct = await prisma.product.update({
            where: {
                id: parseInt(id)
            },
            data: {
                title: title,
                description: description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: parseInt(categoryId),
                images: {
                    deleteMany: {},
                    create: images.map((item) => ({
                        asset_id: item.asset_id,
                        public_id:item.public_id,
                        url: item.url,
                        secure_url: item.secure_url
                    }))
                }
            }
        });
        res.json(updateproduct);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;

        //ค้นหาสินค้า
        const product = await prisma.product.findFirst({
            where: {
                id: parseInt(id)
            },
            include: {
                images: true
            }
        })
        if(!product){
            return res.status(400).json({msg:'Product not found'});
        }
        console.log(product);
        //ลบรูปภาพใน cloudinary , Promise.all ใช้ในการรันฟังก์ชันพร้อมกัน
        const deleteimage = product.images.map((item) => {
            return new Promise((resolve, reject) => {
                cloudinary.uploader.destroy(item.public_id, (result) => {
                    resolve(result);
                });
            });
        });

        await Promise.all(deleteimage);

        //ลบสินค้า
        await prisma.product.delete({
            where: {
                id: parseInt(id)
            }
        });
        res.json({
            msg: 'delete product'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

exports.listby = async (req, res) => {
    try {
        const {sort,order,limit } = req.body;
        console.log(sort,order,limit);
        const products = await prisma.product.findMany({
            take: parseInt(limit),
            orderBy: {
                [sort]: order
            },
            include: {
                images: true,
                category: true
            }
        });
        res.json(products);
    
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}



const handleQuery = async (req, res, query) => {
    try {
        const products = await prisma.product.findMany({
            where: {
               title: {
                   contains: query
               }
            },
            include: {
                images: true,
                category: true
            }
        });
        res.json(products);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}
    
const handlePrice = async (req, res, priceRange) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                price: {
                    gte: priceRange[0],
                    lte: priceRange[1]
                }
            },
            include: {
                images: true,
                category: true
            }
        });
        res.json(products);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

const handleCategory = async (req, res, categoryId) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                categoryId : {
                    in : categoryId.map((id) => parseInt(id))
                }
            },
            include: {
                images: true,
                category: true
            }
        });
        res.json(products);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

exports.searchFilters = async (req, res) => {
    try {
        const { query, category, price } = req.body;
        if (query) {
            console.log('query', query);
            await handleQuery(req, res, query);
        }
        if (category) {
            console.log('category', category);
            await handleCategory(req, res, category);
        }
        if (price) {
            console.log('price', price);
            await handlePrice(req, res, price);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}



exports.createImages = async (req, res) => {
    try {
        const resule = await cloudinary.uploader.upload(req.body.image,{
            public_id: `Yoyo-${Date.now()}`,
            resource_type: 'auto',
            folder: 'ecomshop'
        });
        res.json(resule);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

exports.removeImage = async (req, res) => {
    try {
         const { public_id } = req.body;
        cloudinary.uploader.destroy(public_id, (result) => {
            res.json({ msg: 'Image deleted' });
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}




