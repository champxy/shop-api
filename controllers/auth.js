const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        //restucturing the request body
        const { email, password } = req.body;
        //validation
        if (!email) { return res.status(400).json({ msg: 'Please Enter email' }); }
        if (!password) { return res.status(400).json({ msg: 'Please Enter password' }); }
        //check in database if user already exists
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (user) { return res.status(400).json({ msg: 'User already exists' }); }
        //hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        //create user 
        const newUser = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword
            }
        });

        res.json({
            msg: `User created with email : ${newUser.email}`
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }

}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        //check email
        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        });
        if (!user || !user.enabled) { return res.status(400).json({ msg: 'User Not Found or Not Enabled' }); }
        //check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { return res.status(400).json({ msg: 'Password Incorrect' }); }
        //create payload
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        }
        //create token
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) {
                return res.status(500).json({ msg: 'Server Error' });
            }
            res.json({ payload, token });
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}

exports.currentUser = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where:{
                email:req.user.email
            },select:{
                id:true,
                email:true,
                name:true,
                role:true
            }
        })
        res.json({
            user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Server error' });
    }
}
