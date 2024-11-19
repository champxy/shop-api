const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

exports.authCheck = async (req, res, next) => {
    try {
        const headertoken = req.headers.authorization;

        if (!headertoken) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        const token = headertoken.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        
        //req.user = decoded; จะไปทุกที่ของ route แต่ต้องผ่าน Middleware นี้ก่อน
        //เป็นข้อมูลของ user ที่ login มา
        req.user = decoded;
        const user = await prisma.user.findUnique({
            where: {
                email : req.user.email
            },
        });
        if (!user.enabled) {
            return res.status(401).json({ msg: 'User disabled' });
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Token invalid' });
    }
};



exports.adminCheck = async (req, res, next) => {
    try {
        const { email } = req.user;
        const Adminuser = await prisma.user.findUnique({
            where: {
                email : email
            },
        });

        if (!Adminuser || Adminuser.role !== 'admin') {
            return res.status(401).json({ msg: 'Admin Access denied Admin access only' });
        }
        // console.log("admin : ",Adminuser);
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Error Admin Access denied' });
    }
}